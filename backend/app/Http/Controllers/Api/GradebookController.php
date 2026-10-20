<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonAssessmentSubmission;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Http\Request;

class GradebookController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $courseQuery = Course::with(['sections.lessons']);
        if ($user->role === 'instructor') {
            $courseQuery->where('instructor_id', $user->id);
        }
        $courses = $courseQuery->get();

        $result = $courses->map(function ($course) {
            $enrollments = Enrollment::with('user')->where('course_id', $course->id)->get();
            $students = $enrollments->map(function ($enrollment) use ($course) {
                $student = $enrollment->user;
                $totalLessons = $course->lessons()->count();
                $completed = LessonProgress::where('user_id', $student->id)
                    ->where('course_id', $course->id)
                    ->where('status', 'completed')
                    ->count();

                $submissions = LessonAssessmentSubmission::where('user_id', $student->id)
                    ->where('course_id', $course->id)
                    ->get();

                $avgScore = $submissions->whereNotNull('score')->avg('score');

                return [
                    'student_id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'enrollment_status' => $enrollment->status,
                    'progress_percentage' => $totalLessons > 0 ? (int) round(($completed / $totalLessons) * 100) : 0,
                    'completed_lessons' => $completed,
                    'total_lessons' => $totalLessons,
                    'submissions_count' => $submissions->count(),
                    'pending_submissions' => $submissions->where('status', 'submitted')->count(),
                    'average_score' => $avgScore ? round($avgScore, 1) : null,
                    'last_activity' => $enrollment->updated_at,
                ];
            });

            return [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'students' => $students,
                'total_students' => $students->count(),
            ];
        });

        return response()->json($result);
    }

    public function studentDetail(Request $request, $courseId, $studentId)
    {
        $user = $request->user();
        $course = Course::with(['sections.lessons'])->findOrFail($courseId);
        if ($user->role === 'instructor' && (int) $course->instructor_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = User::findOrFail($studentId);
        $progress = LessonProgress::where('user_id', $studentId)
            ->where('course_id', $courseId)
            ->get()
            ->keyBy('lesson_id');
        $submissions = LessonAssessmentSubmission::with('lesson')
            ->where('user_id', $studentId)
            ->where('course_id', $courseId)
            ->get();

        $lessons = [];
        foreach ($course->sections as $section) {
            foreach ($section->lessons as $lesson) {
                $p = $progress->get($lesson->id);
                $sub = $submissions->firstWhere('lesson_id', $lesson->id);
                $lessons[] = [
                    'lesson_id' => $lesson->id,
                    'lesson_title' => $lesson->title,
                    'section_title' => $section->title,
                    'status' => $p ? $p->status : 'not_started',
                    'completed_at' => $p ? $p->completed_at : null,
                    'assessment_type' => $lesson->assessment_type,
                    'submission' => $sub ? [
                        'id' => $sub->id,
                        'status' => $sub->status,
                        'score' => $sub->score,
                        'passed' => $sub->passed,
                        'attempt_number' => $sub->attempt_number,
                        'teacher_notes' => $sub->teacher_notes,
                        'submitted_at' => $sub->created_at,
                    ] : null,
                ];
            }
        }

        return response()->json([
            'student' => ['id' => $student->id, 'name' => $student->name, 'email' => $student->email],
            'course' => ['id' => $course->id, 'title' => $course->title],
            'lessons' => $lessons,
        ]);
    }
}
