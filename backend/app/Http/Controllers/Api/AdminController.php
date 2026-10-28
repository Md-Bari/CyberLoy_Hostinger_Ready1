<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseLiveSession;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\LessonAssessmentSubmission;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Certificate;
use App\Models\Notification;
use App\Models\AuditLog;
use App\Services\CourseCompletionService;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // A course poster is either an image uploaded through /upload/course-image
    // or an external http(s) image URL.
    private const THUMBNAIL_RULE = ['nullable', 'string', 'max:2048', 'regex:#^(https?://|/api/media/course-images/)#'];

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

        // Analytics Chart 1: Course Enrollment & Completion Distribution
        $coursesList = Course::withCount(['enrollments', 'lessons'])->get();
        $courseAnalytics = $coursesList->map(function ($c) {
            $compCount = Enrollment::where('course_id', $c->id)->where('status', 'completed')->count();
            $revenue = Payment::where('course_id', $c->id)->where('status', 'completed')->sum('amount');
            return [
                'id' => $c->id,
                'title' => $c->title,
                'enrollments' => $c->enrollments_count,
                'completions' => $compCount,
                'revenue' => (float) $revenue,
            ];
        });

        // Analytics Chart 2: Real Monthly Revenue & Enrollment Trends from database
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = \Carbon\Carbon::now()->subMonths($i);
            $monthName = $date->format('M');
            $yearMonth = $date->format('Y-m');
            $monthStart = $date->copy()->startOfMonth()->toDateTimeString();
            $monthEnd = $date->copy()->endOfMonth()->toDateTimeString();

            $rev = Payment::where('status', 'completed')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $enr = Enrollment::whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();

            $comp = Enrollment::where('status', 'completed')
                ->whereBetween('updated_at', [$monthStart, $monthEnd])
                ->count();

            $monthlyTrends[] = [
                'month' => $monthName,
                'year_month' => $yearMonth,
                'revenue' => (float) $rev,
                'enrollments' => $enr,
                'completions' => $comp,
            ];
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
            'course_analytics' => $courseAnalytics,
            'monthly_trends' => $monthlyTrends,
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
        $user = User::findOrFail($userId);
        $enrollments = Enrollment::with(['course.sections.lessons'])->where('user_id', $user->id)->get();

        $formatDate = function ($date, $format = 'Y-m-d H:i') {
            if (!$date) return null;
            try {
                return \Carbon\Carbon::parse($date)->format($format);
            } catch (\Throwable $e) {
                return (string) $date;
            }
        };

        $coursesDetail = $enrollments->map(function ($enrollment) use ($user, $formatDate) {
            $course = $enrollment->course;
            if (!$course) return null;

            $progressRecords = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->get()
                ->keyBy('lesson_id');

            $watchRecords = VideoWatchProgress::where('user_id', $user->id)->get()->keyBy('lesson_id');

            $sections = $course->sections->map(function ($sec) use ($progressRecords, $watchRecords, $user, $formatDate) {
                $lessons = $sec->lessons->map(function ($les) use ($progressRecords, $watchRecords, $user, $formatDate) {
                    $prog = $progressRecords->get($les->id);
                    $vProg = $watchRecords->get($les->id);
                    $submission = LessonAssessmentSubmission::where('user_id', $user->id)
                        ->where('lesson_id', $les->id)
                        ->orderByDesc('created_at')
                        ->first();

                    $watchedSecs = $vProg
                        ? ($vProg->watched_seconds > 0 ? $vProg->watched_seconds : VideoWatchProgress::calculateTotalSeconds($vProg->watched_intervals ?? []))
                        : 0;

                    return [
                        'lesson_id' => $les->id,
                        'title' => $les->title,
                        'duration_seconds' => $les->duration_seconds,
                        'youtube_video_id' => $les->youtube_video_id,
                        'pdf_url' => $les->pdf_url,
                        'assessment_type' => $les->assessment_type,
                        'assessment_config' => $les->assessment_config,
                        'status' => $prog ? $prog->status : 'not_started',
                        'progress_percentage' => $vProg ? $vProg->watch_percentage : ($prog ? $prog->progress_percentage : 0),
                        'watched_seconds' => $watchedSecs,
                        'watched_intervals' => $vProg ? ($vProg->watched_intervals ?? []) : [],
                        'assessment_submission' => $submission ? [
                            'id' => $submission->id,
                            'status' => $submission->status,
                            'answers' => $submission->answers,
                            'score' => $submission->score,
                            'teacher_notes' => $submission->teacher_notes,
                            'submitted_at' => $formatDate($submission->created_at),
                        ] : null,
                        'completed_at' => $prog ? $formatDate($prog->completed_at) : null,
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
                'enrolled_at' => $formatDate($enrollment->created_at, 'Y-m-d'),
                'completed_at' => $formatDate($enrollment->completed_at, 'Y-m-d'),
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
            'certificate_code' => 'nullable|string|max:100',
            'verification_code' => 'nullable|string|max:100',
            'issued_at' => 'nullable|date',
        ]);

        $admin = $request->user();
        $user = User::findOrFail($request->user_id);
        $course = Course::findOrFail($request->course_id);

        // Generate or use custom Certificate ID & Verification Code
        $code = $request->certificate_code ?: ('CERT-' . date('Y') . '-' . strtoupper(Str::random(6)) . '-' . rand(100, 999));
        $verCode = $request->verification_code ?: ('VER-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)));
        $issueDate = $request->issued_at ? \Carbon\Carbon::parse($request->issued_at) : now();

        $certificate = Certificate::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            [
                'certificate_code' => $code,
                'verification_code' => $verCode,
                'issued_by' => $admin ? $admin->id : 1,
                'issued_at' => $issueDate,
                'completion_date' => $issueDate,
                'status' => 'issued',
            ]
        );

        // Update enrollment status
        Enrollment::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            ['status' => 'completed', 'payment_status' => 'paid', 'completed_at' => $issueDate]
        );

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
        ], $admin ? $admin->id : 1);

        $certificate->load(['user', 'course', 'issuer']);

        return response()->json([
            'message' => 'Certificate issued successfully and assigned to student!',
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
            'instructor_id' => 'nullable|exists:users,id',
            'thumbnail_url' => self::THUMBNAIL_RULE,
        ]);

        if ($request->filled('instructor_id') && User::whereKey($request->instructor_id)->where('role', 'instructor')->doesntExist()) {
            return response()->json(['message' => 'The selected user is not an instructor.'], 422);
        }

        $course = Course::create([
            'title' => $request->title,
            'instructor_id' => $request->instructor_id,
            'slug' => Str::slug($request->title) . '-' . rand(100, 999),
            'description' => $request->description,
            'thumbnail_url' => $request->thumbnail_url ?: null,
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

        $request->validate([
            'instructor_id' => 'nullable|exists:users,id',
            'thumbnail_url' => self::THUMBNAIL_RULE,
        ]);
        if ($request->filled('instructor_id') && User::whereKey($request->instructor_id)->where('role', 'instructor')->doesntExist()) {
            return response()->json(['message' => 'The selected user is not an instructor.'], 422);
        }

        $previousThumbnail = $course->thumbnail_url;
        $data = $request->only([
            'title', 'description', 'level', 'category', 'duration',
            'price', 'progression_mode', 'status', 'prerequisites', 'learning_objectives',
            'instructor_id',
        ]);
        if ($request->has('thumbnail_url')) {
            $data['thumbnail_url'] = $request->thumbnail_url ?: null;
        }
        $course->update($data);

        if ($request->has('thumbnail_url') && $previousThumbnail !== $course->thumbnail_url) {
            UploadController::deleteCourseImage($previousThumbnail);
        }

        if ($request->has('status')) {
            $course->is_published = ($request->status === 'published');
            $course->save();
        }

        AuditLog::log('update_course', 'Course', $course->id);

        return response()->json($course);
    }

    /**
     * Issue a LiveKit token for the current user. Every participant gets their own
     * identity — LiveKit disconnects the older connection when two share one.
     */
    public function joinCourseLiveSession(Request $request, $id)
    {
        $session = CourseLiveSession::with('course')->findOrFail($id);
        $course = $session->course;
        $user = $request->user();

        $isHost = $user->role === 'admin'
            || ($user->role === 'instructor' && (int) $course->instructor_id === (int) $user->id);
        $isPaidStudent = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('payment_status', 'paid')
            ->exists();

        if (!$isHost && !$isPaidStudent) {
            return response()->json(['message' => 'Enroll in this course to join its live classes.'], 403);
        }
        if (!$isHost && in_array($session->status, ['completed', 'cancelled'], true)) {
            return response()->json(['message' => 'This live class has ' . $session->status . '.'], 410);
        }

        $apiKey = config('lms.livekit_api_key');
        $apiSecret = config('lms.livekit_api_secret');
        $livekitUrl = config('lms.livekit_url');
        if (!$apiKey || !$apiSecret || !$livekitUrl) {
            return response()->json(['message' => 'Live classes are not configured on this server.'], 503);
        }

        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity('user-' . $user->id)
            ->setName($user->name)
            ->setMetadata(json_encode(['role' => $user->role, 'is_host' => $isHost]))
            ->setTtl(60 * 60 * 6);

        $videoGrant = (new VideoGrant())
            ->setRoomJoin()
            ->setRoomName($session->room_name)
            ->setCanPublish()
            ->setCanSubscribe()
            ->setCanPublishData()
            ->setRoomAdmin($isHost);

        $token = (new AccessToken($apiKey, $apiSecret))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        return response()->json([
            'token' => $token,
            'ws_url' => rtrim($livekitUrl, '/'),
            'room_name' => $session->room_name,
            'title' => $session->title,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'host_name' => $session->host_name,
            'is_host' => $isHost,
            'name' => $user->name,
        ]);
    }

    public function createCourseLiveSession(Request $request, $courseId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'starts_at' => 'nullable|date',
            'duration_minutes' => 'nullable|integer|min:15|max:300',
            'status' => 'nullable|in:scheduled,live,completed,cancelled',
        ]);

        $course = Course::findOrFail($courseId);
        $actor = $request->user();
        if (!$actor || ($actor->role !== 'admin' && !($actor->role === 'instructor' && (int) $course->instructor_id === (int) $actor->id))) {
            return response()->json(['message' => 'Only admins or the assigned instructor can schedule sessions.'], 403);
        }

        $startsAt = $request->filled('starts_at') ? \Carbon\Carbon::parse($request->starts_at) : now()->addHour();
        $durationMinutes = (int) ($request->duration_minutes ?? 60);
        $roomName = $request->room_name ?? 'course-' . $course->id . '-' . Str::slug($request->title) . '-' . now()->format('YmdHis');
        $session = CourseLiveSession::create([
            'course_id' => $course->id,
            'title' => $request->title,
            'description' => $request->description,
            'room_name' => $roomName,
            'host_name' => $actor->name,
            'status' => $request->status ?? 'scheduled',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($durationMinutes),
            'created_by' => $actor->id,
        ]);

        return response()->json($session, 201);
    }

    public function updateCourseLiveSession(Request $request, $id)
    {
        $session = CourseLiveSession::findOrFail($id);
        $course = $session->course;
        $actor = $request->user();

        if (!$actor || ($actor->role !== 'admin' && !($actor->role === 'instructor' && (int) $course->instructor_id === (int) $actor->id))) {
            return response()->json(['message' => 'Only admins or the assigned instructor can update live sessions.'], 403);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'starts_at' => 'nullable|date',
            'duration_minutes' => 'nullable|integer|min:15|max:300',
            'status' => 'nullable|in:scheduled,live,completed,cancelled',
        ]);

        $updates = $request->only(['title', 'description', 'status']);
        if ($request->filled('starts_at')) {
            $startsAt = \Carbon\Carbon::parse($request->starts_at);
            $updates['starts_at'] = $startsAt;
            $durationMinutes = (int) ($request->duration_minutes ?? ($session->starts_at && $session->ends_at ? max(15, (int) $session->starts_at->diffInMinutes($session->ends_at)) : 60));
            $updates['ends_at'] = $startsAt->copy()->addMinutes($durationMinutes);
        }

        if ($request->filled('duration_minutes') && $session->starts_at) {
            $updates['ends_at'] = $session->starts_at->copy()->addMinutes((int) $request->duration_minutes);
        }

        $session->update($updates);
        return response()->json($session);
    }

    public function deleteCourseLiveSession(Request $request, $id)
    {
        $session = CourseLiveSession::findOrFail($id);
        $course = $session->course;
        $actor = $request->user();

        if (!$actor || ($actor->role !== 'admin' && !($actor->role === 'instructor' && (int) $course->instructor_id === (int) $actor->id))) {
            return response()->json(['message' => 'Only admins or the assigned instructor can delete live sessions.'], 403);
        }

        $session->delete();
        return response()->json(['message' => 'Live session deleted successfully.']);
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
            'pdf_url' => 'nullable|string',
            'assessment_type' => 'nullable|in:none,mcq,written',
            'assessment_config' => 'nullable|array',
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
            'pdf_url' => $request->pdf_url,
            'assessment_type' => $request->assessment_type ?? 'none',
            'assessment_config' => $request->assessment_config ?? [],
            'duration_seconds' => $request->duration_seconds ?? 600,
            'sort_order' => $maxOrder + 1,
            'is_required' => true,
            'completion_type' => $ytId ? 'video' : ($request->assessment_type === 'none' ? 'content' : 'manual'),
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

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'youtube_url' => 'nullable|string',
            'pdf_url' => 'nullable|string',
            'assessment_type' => 'nullable|in:none,mcq,written',
            'assessment_config' => 'nullable|array',
            'duration_seconds' => 'nullable|integer',
        ]);

        $assessmentChanged = ($request->has('assessment_type') && $request->assessment_type !== $lesson->assessment_type)
            || ($request->has('assessment_config') && ($request->assessment_config ?? []) !== ($lesson->assessment_config ?? []));
        $data = $request->only(['title', 'description', 'content', 'duration_seconds', 'sort_order', 'is_required', 'required_watch_percentage', 'pdf_url', 'assessment_type']);

        if ($request->has('youtube_url')) {
            $data['youtube_url'] = $request->youtube_url;
            $data['youtube_video_id'] = Lesson::extractYouTubeId($request->youtube_url);
        }

        if ($request->has('assessment_config')) {
            $data['assessment_config'] = $request->assessment_config ?? [];
        }

        // Keep the completion rule in sync with the lesson type, as addLesson does;
        // otherwise a lesson whose video was removed could never be completed.
        if ($request->has('youtube_url') || $request->has('assessment_type')) {
            $videoId = array_key_exists('youtube_video_id', $data) ? $data['youtube_video_id'] : $lesson->youtube_video_id;
            $assessmentType = $data['assessment_type'] ?? $lesson->assessment_type ?? 'none';
            $data['completion_type'] = $videoId ? 'video' : ($assessmentType === 'none' ? 'content' : 'manual');
        }

        $lesson->update($data);
        if ($assessmentChanged) {
            LessonAssessmentSubmission::where('lesson_id', $lesson->id)->delete();
            LessonProgress::where('lesson_id', $lesson->id)
                ->update(['status' => 'in_progress', 'completed_at' => null]);
            $course = $lesson->section->course;
            Enrollment::with('user')->where('course_id', $course->id)->get()
                ->each(fn (Enrollment $enrollment) => CourseCompletionService::refresh($course, $enrollment->user));
        }

        return response()->json($lesson);
    }

    public function deleteLesson($id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->delete();
        return response()->json(['message' => 'Lesson deleted successfully.']);
    }
}
