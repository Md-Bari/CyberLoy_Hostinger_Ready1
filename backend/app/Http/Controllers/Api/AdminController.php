<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Certificate;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function dashboardStats()
    {
        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $totalPayments = Payment::where('status', 'completed')->count();
        $totalStudents = User::where('role', 'user')->count();
        $totalCourses = Course::count();
        $totalEnrollments = Enrollment::count();
        $completedEnrollments = Enrollment::where('status', 'completed')->count();
        $certificatesIssued = Certificate::where('status', 'issued')->count();

        // Pending certificates: enrollments completed with no issued certificate yet
        $issuedUserCoursePairs = Certificate::where('status', 'issued')
            ->select('user_id', 'course_id')
            ->get()
            ->map(fn($c) => "{$c->user_id}-{$c->course_id}")
            ->toArray();

        $pendingCertificatesCount = 0;
        $completedEnrollmentsList = Enrollment::where('status', 'completed')->get();
        foreach ($completedEnrollmentsList as $enr) {
            if (!in_array("{$enr->user_id}-{$enr->course_id}", $issuedUserCoursePairs)) {
                $pendingCertificatesCount++;
            }
        }

        return response()->json([
            'total_students' => $totalStudents,
            'total_courses' => $totalCourses,
            'total_enrollments' => $totalEnrollments,
            'completed_enrollments' => $completedEnrollments,
            'pending_certificates' => $pendingCertificatesCount,
            'certificates_issued' => $certificatesIssued,
            'total_revenue' => (float) $totalRevenue,
            'total_payments' => $totalPayments,
            'completion_rate' => $totalEnrollments > 0 ? (int) round(($completedEnrollments / $totalEnrollments) * 100) : 0,
        ]);
    }

    public function paymentsList()
    {
        $payments = Payment::with(['user:id,name,email', 'course:id,title,price'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }

    public function userActivities()
    {
        $users = User::where('role', 'user')->orderBy('created_at', 'desc')->get();

        $activities = $users->map(function ($user) {
            $enrollments = Enrollment::with(['course.sections.lessons', 'payment'])->where('user_id', $user->id)->get();

            $courseProgress = $enrollments->map(function ($enrollment) use ($user) {
                $course = $enrollment->course;
                if (!$course) return null;

                $totalLessons = $course->lessons()->count();
                $completedCount = LessonProgress::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('status', 'completed')
                    ->count();

                $progressPercentage = $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0;

                $certificate = Certificate::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('status', 'issued')
                    ->first();

                return [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'status' => $enrollment->status,
                    'payment_status' => $enrollment->payment_status,
                    'payment_amount' => $enrollment->payment ? $enrollment->payment->amount : $course->price,
                    'transaction_id' => $enrollment->payment ? $enrollment->payment->transaction_id : null,
                    'total_lessons' => $totalLessons,
                    'completed_lessons' => $completedCount,
                    'progress_percentage' => $progressPercentage,
                    'has_certificate' => (bool) $certificate,
                    'certificate_code' => $certificate ? $certificate->certificate_code : null,
                    'is_ready_for_certificate' => ($progressPercentage >= 100 && !$certificate),
                ];
            })->filter()->values();

            return [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'joined_at' => $user->created_at->format('Y-m-d'),
                'courses' => $courseProgress,
            ];
        });

        return response()->json($activities);
    }

    public function studentProgressDetail($userId)
    {
        $user = User::where('role', 'user')->findOrFail($userId);
        $enrollments = Enrollment::with(['course.sections.lessons'])->where('user_id', $user->id)->get();

        $coursesDetail = $enrollments->map(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            if (!$course) return null;

            $progressRecords = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->get()
                ->keyBy('lesson_id');

            $watchRecords = VideoWatchProgress::where('user_id', $user->id)->get()->keyBy('lesson_id');

            $sections = $course->sections->map(function ($sec) use ($progressRecords, $watchRecords) {
                $lessons = $sec->lessons->map(function ($les) use ($progressRecords, $watchRecords) {
                    $prog = $progressRecords->get($les->id);
                    $vProg = $watchRecords->get($les->id);

                    return [
                        'lesson_id' => $les->id,
                        'title' => $les->title,
                        'duration_seconds' => $les->duration_seconds,
                        'youtube_video_id' => $les->youtube_video_id,
                        'status' => $prog ? $prog->status : 'not_started',
                        'progress_percentage' => $vProg ? $vProg->watch_percentage : ($prog ? $prog->progress_percentage : 0),
                        'watched_seconds' => $vProg ? VideoWatchProgress::calculateTotalSeconds($vProg->watched_intervals ?? []) : 0,
                        'watched_intervals' => $vProg ? ($vProg->watched_intervals ?? []) : [],
                        'completed_at' => $prog ? ($prog->completed_at ? $prog->completed_at->format('Y-m-d H:i') : null) : null,
                    ];
                });

                $total = $lessons->count();
                $completed = $lessons->where('status', 'completed')->count();

                return [
                    'section_id' => $sec->id,
                    'title' => $sec->title,
                    'total_lessons' => $total,
                    'completed_lessons' => $completed,
                    'progress_percentage' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
                    'lessons' => $lessons,
                ];
            });

            $certificate = Certificate::where('user_id', $user->id)->where('course_id', $course->id)->first();

            return [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'enrollment_status' => $enrollment->status,
                'payment_status' => $enrollment->payment_status,
                'enrolled_at' => $enrollment->created_at->format('Y-m-d'),
                'completed_at' => $enrollment->completed_at ? $enrollment->completed_at->format('Y-m-d') : null,
                'certificate' => $certificate,
                'sections' => $sections,
            ];
        })->filter()->values();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joined_at' => $user->created_at->format('Y-m-d'),
            ],
            'courses' => $coursesDetail,
        ]);
    }

    public function issueCertificate(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        $admin = $request->user();
        $user = User::findOrFail($request->user_id);
        $course = Course::findOrFail($request->course_id);

        // Generate unique official Certificate ID & Verification Code
        $code = 'CERT-' . date('Y') . '-' . strtoupper(Str::random(6)) . '-' . rand(100, 999);
        $verCode = 'VER-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));

        $certificate = Certificate::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            [
                'certificate_code' => $code,
                'verification_code' => $verCode,
                'issued_by' => $admin->id,
                'issued_at' => now(),
                'completion_date' => now(),
                'status' => 'issued',
            ]
        );

        // Update enrollment status
        Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->update(['status' => 'completed', 'completed_at' => now()]);

        // Send in-app notification to the user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Official Certificate Issued!',
            'message' => 'Congratulations! Your certificate for "' . $course->title . '" has been issued. Certificate Code: ' . $code . ' (Verification Code: ' . $verCode . ')',
            'type' => 'certificate_issued',
            'is_read' => false,
        ]);

        AuditLog::log('issue_certificate', 'Certificate', $certificate->id, [
            'user_id' => $user->id,
            'course_id' => $course->id,
            'certificate_code' => $code,
        ], $admin->id);

        return response()->json([
            'message' => 'Certificate issued successfully and sent to student notifications!',
            'certificate' => $certificate,
        ]);
    }

    // ==========================================
    // Course Builder & Content Management APIs
    // ==========================================

    public function createCourse(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'level' => 'nullable|string',
            'category' => 'nullable|string',
            'duration' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'progression_mode' => 'nullable|in:sequential,open',
            'status' => 'nullable|in:draft,published,unpublished,archived',
        ]);

        $course = Course::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . rand(100, 999),
            'description' => $request->description,
            'level' => $request->level ?? 'Beginner',
            'category' => $request->category ?? 'Cybersecurity',
            'duration' => $request->duration ?? '4 Weeks',
            'price' => $request->price ?? 49.00,
            'currency' => 'USD',
            'requires_payment' => (float) ($request->price ?? 49.00) > 0,
            'progression_mode' => $request->progression_mode ?? 'sequential',
            'status' => $request->status ?? 'published',
            'is_published' => ($request->status ?? 'published') === 'published',
        ]);

        AuditLog::log('create_course', 'Course', $course->id, ['title' => $course->title]);

        return response()->json($course, 201);
    }

    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $course->update($request->only([
            'title', 'description', 'level', 'category', 'duration',
            'price', 'progression_mode', 'status', 'prerequisites', 'learning_objectives'
        ]));

        if ($request->has('status')) {
            $course->is_published = ($request->status === 'published');
            $course->save();
        }

        AuditLog::log('update_course', 'Course', $course->id);

        return response()->json($course);
    }

    public function deleteCourse($id)
    {
        $course = Course::findOrFail($id);
        $title = $course->title;
        $course->delete();

        AuditLog::log('delete_course', 'Course', $id, ['title' => $title]);

        return response()->json(['message' => "Course '{$title}' deleted successfully."]);
    }

    public function addSection(Request $request, $courseId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course = Course::findOrFail($courseId);
        $maxOrder = $course->sections()->max('sort_order') ?? 0;

        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => $request->title,
            'description' => $request->description,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($section, 201);
    }

    public function addLesson(Request $request, $sectionId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'youtube_url' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
        ]);

        $section = CourseSection::findOrFail($sectionId);
        $maxOrder = $section->lessons()->max('sort_order') ?? 0;

        $ytUrl = $request->youtube_url;
        $ytId = Lesson::extractYouTubeId($ytUrl);

        $lesson = Lesson::create([
            'section_id' => $section->id,
            'title' => $request->title,
            'description' => $request->description,
            'content' => $request->content,
            'youtube_url' => $ytUrl,
            'youtube_video_id' => $ytId,
            'duration_seconds' => $request->duration_seconds ?? 600,
            'sort_order' => $maxOrder + 1,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        return response()->json($lesson, 201);
    }

    public function updateSection(Request $request, $id)
    {
        $section = CourseSection::findOrFail($id);
        $section->update($request->only(['title', 'description', 'sort_order']));
        return response()->json($section);
    }

    public function deleteSection($id)
    {
        $section = CourseSection::findOrFail($id);
        $section->delete();
        return response()->json(['message' => 'Section deleted successfully.']);
    }

    public function updateLesson(Request $request, $id)
    {
        $lesson = Lesson::findOrFail($id);

        $data = $request->only(['title', 'description', 'content', 'duration_seconds', 'sort_order', 'is_required', 'required_watch_percentage']);

        if ($request->has('youtube_url')) {
            $data['youtube_url'] = $request->youtube_url;
            $data['youtube_video_id'] = Lesson::extractYouTubeId($request->youtube_url);
        }

        $lesson->update($data);

        return response()->json($lesson);
    }

    public function deleteLesson($id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->delete();
        return response()->json(['message' => 'Lesson deleted successfully.']);
    }
}
