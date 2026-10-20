<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CourseCompletionService
{
    public static function refresh(Course $course, User $user): array
    {
        return DB::transaction(function () use ($course, $user) {
            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->lockForUpdate()
                ->first();
            $lessons = $course->lessons()->get(['lessons.id', 'lessons.is_required']);
            $requiredLessons = $lessons->where('is_required', true);
            if ($requiredLessons->isEmpty()) {
                $requiredLessons = $lessons;
            }

            $completedIds = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('status', 'completed')
                ->pluck('lesson_id');
            $completedCount = $requiredLessons->whereIn('id', $completedIds)->count();
            $total = $requiredLessons->count();
            $isComplete = $total > 0 && $completedCount === $total;

            if ($enrollment && $isComplete && $enrollment->status !== 'completed') {
                $enrollment->update(['status' => 'completed', 'completed_at' => now()]);
                foreach (User::where('role', 'admin')->get() as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'title' => 'Student completed course: ' . $user->name,
                        'message' => $user->name . ' (' . $user->email . ') completed "' . $course->title . '".',
                        'type' => 'course_completed',
                        'is_read' => false,
                    ]);
                }
                Notification::create([
                    'user_id' => $user->id,
                    'title' => 'Course completed: ' . $course->title,
                    'message' => 'Congratulations! You completed "' . $course->title . '".',
                    'type' => 'course_completed',
                    'is_read' => false,
                ]);
            } elseif ($enrollment && !$isComplete && $enrollment->status === 'completed') {
                $enrollment->update(['status' => 'enrolled', 'completed_at' => null]);
            }

            return [
                'completed_lessons' => $completedCount,
                'total_lessons' => $total,
                'progress_percentage' => $total > 0 ? (int) round(($completedCount / $total) * 100) : 0,
                'is_complete' => $isComplete,
            ];
        });
    }
}
