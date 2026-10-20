<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Notification;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function studentDashboard(Request $request)
    {
        $user = $request->user();
        $enrollments = Enrollment::with(['course.sections.lessons'])
            ->where('user_id', $user->id)
            ->get();

        $courses = $enrollments->map(function ($enrollment) {
            $course = $enrollment->course;
            if (!$course) return null;

            $totalLessons = $course->lessons()->count();
            $completedCount = LessonProgress::where('user_id', $enrollment->user_id)
                ->where('course_id', $course->id)
                ->where('status', 'completed')
                ->count();

            return [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'level' => $course->level,
                'category' => $course->category,
                'thumbnail' => $course->thumbnail ?? null,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedCount,
                'progress_percentage' => $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0,
                'enrollment_status' => $enrollment->status,
                'payment_status' => $enrollment->payment_status,
                'enrolled_at' => $enrollment->created_at,
            ];
        })->filter()->values();

        $certificates = Certificate::with('course')
            ->where('user_id', $user->id)
            ->where('status', 'issued')
            ->latest()
            ->take(5)
            ->get();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        $announcements = Announcement::with('course')
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) use ($courses) {
                $q->where('type', 'global')
                  ->orWhereIn('course_id', $courses->pluck('id'));
            })
            ->latest()
            ->take(5)
            ->get();

        $stats = [
            'enrolled_courses' => $courses->count(),
            'completed_courses' => $courses->where('enrollment_status', 'completed')->count(),
            'in_progress' => $courses->where('enrollment_status', 'enrolled')->where('progress_percentage', '>', 0)->count(),
            'certificates' => $certificates->count(),
            'total_hours' => $courses->sum('estimated_hours') ?? 0,
        ];

        return response()->json([
            'user' => $user,
            'courses' => $courses,
            'certificates' => $certificates,
            'notifications' => $notifications,
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }
}
