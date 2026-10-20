<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LessonAssessmentSubmission;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Notification;
use App\Services\CourseCompletionService;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function submissions(Request $request)
    {
        $user = $request->user();
        $courseIds = Course::query()
            ->when($user->role !== 'admin', fn ($query) => $query->where('instructor_id', $user->id))
            ->select('id');

        return LessonAssessmentSubmission::with([
            'user:id,name,email',
            'lesson:id,title,section_id,assessment_type',
            'lesson.section:id,title,course_id',
        ])
            ->whereIn('course_id', $courseIds)
            ->where('status', 'submitted')
            ->latest()
            ->paginate(30);
    }

    public function grade(Request $request, $submissionId)
    {
        $submission = LessonAssessmentSubmission::with('lesson.section')->findOrFail($submissionId);
        $course = $submission->lesson?->section?->course;
        abort_unless($course, 404);

        $user = $request->user();
        abort_unless(
            $user->role === 'admin' || (int) $course->instructor_id === (int) $user->id,
            403,
            'You are not assigned to this course.'
        );

        abort_unless($submission->status === 'submitted', 409, 'This submission has already been reviewed.');

        $validated = $request->validate([
            'score' => 'required|integer|min:0|max:100',
            'passed' => 'required|boolean',
            'teacher_notes' => 'nullable|string|max:10000',
        ]);

        $submission->update([
            'score' => $validated['score'],
            'passed' => $validated['passed'],
            'teacher_notes' => $validated['teacher_notes'] ?? null,
            'status' => 'reviewed',
        ]);

        if ($validated['passed']) {
            $videoComplete = (!$submission->lesson->youtube_video_id
                && $submission->lesson->completion_type !== 'video')
                || VideoWatchProgress::where('user_id', $submission->user_id)
                    ->where('lesson_id', $submission->lesson_id)
                    ->where('completed', true)
                    ->exists();
            if ($videoComplete) {
                LessonProgress::updateOrCreate(
                    [
                        'user_id' => $submission->user_id,
                        'course_id' => $submission->course_id,
                        'lesson_id' => $submission->lesson_id,
                    ],
                    [
                        'section_id' => $submission->lesson->section_id,
                        'status' => 'completed',
                        'progress_percentage' => 100,
                        'completed_at' => now(),
                        'last_accessed_at' => now(),
                    ]
                );
            }
            CourseCompletionService::refresh($course, $submission->user);
        }

        Notification::create([
            'user_id' => $submission->user_id,
            'title' => 'Assessment reviewed: ' . $submission->lesson->title,
            'message' => 'Your assessment score is ' . $validated['score'] . '%. '
                . ($validated['passed'] ? 'You passed.' : 'Review the instructor feedback and retry if attempts remain.'),
            'type' => 'assessment_review',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Assessment reviewed successfully.',
            'submission' => $submission->fresh(),
        ]);
    }
}
