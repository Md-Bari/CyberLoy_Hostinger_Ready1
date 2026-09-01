<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Enrollment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class VideoProgressController extends Controller
{
    protected function getAuthenticatedUser(Request $request)
    {
        return auth('api')->user() ?? $request->user();
    }

    public function recordProgress(Request $request)
    {
        $request->validate([
            'lesson_id'            => 'required|exists:lessons,id',
            'current_position'     => 'required|numeric|min:0',
            'duration'             => 'required|numeric|min:1',
            'active_seconds_delta' => 'nullable|integer|min:0', // Real seconds user was watching since last sync
            'interval_start'       => 'nullable|numeric|min:0',
            'interval_end'         => 'nullable|numeric|min:0',
            'video_id'             => 'nullable|string',
        ]);

        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $lesson  = Lesson::with('section.course')->findOrFail($request->lesson_id);
        $section = $lesson->section;
        $course  = $section->course;

        // Verify student is enrolled and unlocked
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($user->role !== 'admin') {
            if (!$enrollment || ($course->requires_payment && $enrollment->payment_status !== 'paid')) {
                return response()->json([
                    'message' => 'Course is locked. Please complete enrollment and payment to record learning progress.',
                    'locked'  => true,
                ], 403);
            }
        }

        $duration     = (int) round($request->duration);
        $currentPos   = (int) round($request->current_position);
        $activeDelta  = max(0, (int) ($request->active_seconds_delta ?? 0));

        // Lesson's configured duration is AUTHORITATIVE
        $effectiveDuration = ($lesson->duration_seconds > 0)
            ? $lesson->duration_seconds
            : (($duration > 0) ? $duration : 600);

        $requiredPercentage = $lesson->required_watch_percentage ?? 100;

        // ─── Retrieve or create video watch record ────────────────────────────
        $videoWatch = VideoWatchProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'video_id'         => $request->video_id ?? $lesson->youtube_video_id,
                'duration'         => $effectiveDuration,
                'watched_intervals'=> [],
                'watch_percentage' => 0,
                'completed'        => false,
            ]
        );

        // ─── Choose tracking strategy based on whether admin set a fixed duration ──
        if ($lesson->duration_seconds > 0) {
            // ── TIME-SPENT MODE ──────────────────────────────────────────────
            // Use accumulated active watch seconds, not interval coverage.
            // This correctly handles seeking, replaying, and skipping.
            $previousWatchedSeconds = $videoWatch->watched_seconds ?? 0;
            $totalWatchedSeconds    = $previousWatchedSeconds + $activeDelta;

            $watchPercentage = min(100, (int) round(($totalWatchedSeconds / $effectiveDuration) * 100));
            $requiredSeconds = (int) ceil($effectiveDuration * ($requiredPercentage / 100));
            $isCompleted     = ($totalWatchedSeconds >= $requiredSeconds);

            if ($isCompleted) $watchPercentage = 100;

            $videoWatch->update([
                'current_position' => $currentPos,
                'duration'         => $effectiveDuration,
                'watch_percentage' => $watchPercentage,
                'watched_seconds'  => $totalWatchedSeconds,
                'last_heartbeat'   => now(),
                'completed'        => $isCompleted || $videoWatch->completed,
                'completed_at'     => ($isCompleted && !$videoWatch->completed_at) ? now() : $videoWatch->completed_at,
            ]);

        } else {
            // ── INTERVAL COVERAGE MODE (no admin duration set) ───────────────
            // Track which portions of the video have been watched.
            $intervalStart = (int) round($request->interval_start ?? max(0, $currentPos - 10));
            $intervalEnd   = (int) round($request->interval_end   ?? $currentPos);

            $existingIntervals   = $videoWatch->watched_intervals ?? [];
            $mergedIntervals     = VideoWatchProgress::mergeIntervals($existingIntervals, $intervalStart, $intervalEnd);
            $totalWatchedSeconds = VideoWatchProgress::calculateTotalSeconds($mergedIntervals);

            $watchPercentage = min(100, (int) round(($totalWatchedSeconds / $effectiveDuration) * 100));
            $isCompleted     = ($watchPercentage >= $requiredPercentage)
                || ($totalWatchedSeconds >= ($effectiveDuration * ($requiredPercentage / 100) - 5));

            if ($isCompleted) $watchPercentage = 100;

            $videoWatch->update([
                'current_position'  => $currentPos,
                'duration'          => $effectiveDuration,
                'watch_percentage'  => $watchPercentage,
                'watched_intervals' => $mergedIntervals,
                'watched_seconds'   => $totalWatchedSeconds,
                'last_heartbeat'    => now(),
                'completed'         => $isCompleted || $videoWatch->completed,
                'completed_at'      => ($isCompleted && !$videoWatch->completed_at) ? now() : $videoWatch->completed_at,
            ]);
        }

        // ─── Update lesson progress record ────────────────────────────────────
        $lessonProgress = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'course_id'  => $course->id,
                'section_id' => $section->id,
                'started_at' => now(),
            ]
        );

        $wasAlreadyCompleted = ($lessonProgress->status === 'completed');
        $newStatus = $isCompleted ? 'completed' : 'in_progress';

        $lessonProgress->update([
            'course_id'           => $course->id,
            'section_id'          => $section->id,
            'status'              => ($wasAlreadyCompleted ? 'completed' : $newStatus),
            'progress_percentage' => max($lessonProgress->progress_percentage, $watchPercentage),
            'watched_seconds'     => $videoWatch->watched_seconds,
            'completed_at'        => ($isCompleted && !$lessonProgress->completed_at) ? now() : $lessonProgress->completed_at,
            'last_accessed_at'    => now(),
        ]);

        // ─── Recalculate Course Total Progress ────────────────────────────────
        $allLessons           = $course->lessons()->get();
        $totalRequiredLessons = $allLessons->where('is_required', true)->count();
        if ($totalRequiredLessons === 0) $totalRequiredLessons = $allLessons->count();

        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'completed')
            ->pluck('lesson_id')
            ->toArray();

        $completedCount           = count(array_intersect($allLessons->pluck('id')->toArray(), $completedLessonIds));
        $courseProgressPercentage = $totalRequiredLessons > 0
            ? (int) round(($completedCount / $totalRequiredLessons) * 100)
            : 0;

        // ─── Recalculate Section Progress ─────────────────────────────────────
        $sectionLessons           = $section->lessons()->pluck('id')->toArray();
        $sectionCompleted         = count(array_intersect($sectionLessons, $completedLessonIds));
        $sectionProgressPercentage = count($sectionLessons) > 0
            ? (int) round(($sectionCompleted / count($sectionLessons)) * 100)
            : 0;

        $isCourseFullyCompleted = ($courseProgressPercentage >= 100 && $completedCount >= $totalRequiredLessons);

        // ─── Course completion notifications ──────────────────────────────────
        if ($enrollment && $isCourseFullyCompleted && $enrollment->status !== 'completed') {
            $enrollment->update(['status' => 'completed', 'completed_at' => now()]);

            foreach (User::where('role', 'admin')->get() as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title'   => 'Student Completed Course: ' . $user->name,
                    'message' => "Student {$user->name} ({$user->email}) has completed 100% of '{$course->title}'. Certificate issuance is now pending.",
                    'type'    => 'course_completed',
                    'is_read' => false,
                ]);
            }

            Notification::create([
                'user_id' => $user->id,
                'title'   => 'Course Completed: ' . $course->title,
                'message' => "Congratulations {$user->name}! You have successfully completed '{$course->title}'. Your completion certificate is now being processed.",
                'type'    => 'course_completed',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'lesson_id'                  => $lesson->id,
            'watch_percentage'           => $watchPercentage,
            'lesson_completed'           => ($lessonProgress->status === 'completed'),
            'watched_seconds'            => $videoWatch->watched_seconds,
            'required_seconds'           => $effectiveDuration,
            'section_id'                 => $section->id,
            'section_progress_percentage'=> $sectionProgressPercentage,
            'course_progress_percentage' => $courseProgressPercentage,
            'completed_lessons'          => $completedCount,
            'total_lessons'              => $totalRequiredLessons,
            'is_course_completed'        => $isCourseFullyCompleted,
        ]);
    }
}
