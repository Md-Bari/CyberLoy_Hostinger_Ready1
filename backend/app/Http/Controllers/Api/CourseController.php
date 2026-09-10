<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\LessonAssessmentSubmission;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class CourseController extends Controller
{
    protected function getAuthenticatedUser(Request $request)
    {
        return auth('api')->user() ?? $request->user();
    }

    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        $query = Course::with(['sections.lessons'])
            ->withCount(['sections', 'lessons']);

        // Only published courses for non-admins
        if (!$user || $user->role !== 'admin') {
            $query->where('status', 'published');
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Difficulty / Level filter
        if ($request->filled('level') && $request->level !== 'all') {
            $query->where('level', $request->level);
        }

        $courses = $query->get();

        $courses->transform(function ($course) use ($user) {
            if ($user) {
                $enrollment = Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->first();

                $isPaid = $enrollment && ($enrollment->payment_status === 'paid' || $enrollment->status === 'enrolled' || $enrollment->status === 'completed');
                $isUnlocked = (bool) ($user->role === 'admin' || ($enrollment ? ($isPaid || !$course->requires_payment) : !$course->requires_payment));

                $course->is_enrolled = (bool) $enrollment;
                $course->payment_status = $enrollment ? ($enrollment->payment_status ?? 'paid') : 'unpaid';
                $course->is_unlocked = $isUnlocked;
                $course->enrollment_status = $enrollment ? $enrollment->status : null;

                // Calculate course progress percentage
                $allLessons = $course->lessons;
                $totalLessons = $allLessons->count();
                if ($totalLessons > 0) {
                    $completedCount = LessonProgress::where('user_id', $user->id)
                        ->where('course_id', $course->id)
                        ->where('status', 'completed')
                        ->count();

                    $course->completed_lessons = $completedCount;
                    $course->progress_percentage = (int) round(($completedCount / $totalLessons) * 100);
                } else {
                    $course->completed_lessons = 0;
                    $course->progress_percentage = 0;
                }
            } else {
                $course->is_enrolled = false;
                $course->payment_status = 'unpaid';
                $course->is_unlocked = (bool) (!$course->requires_payment);
                $course->enrollment_status = null;
                $course->completed_lessons = 0;
                $course->progress_percentage = 0;
            }

            return $course;
        });

        return response()->json($courses);
    }

    public function show(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        $course = Course::with(['sections' => function ($q) {
            $q->orderBy('sort_order')->with(['lessons' => function ($lq) {
                $lq->orderBy('sort_order');
            }]);
        }])->findOrFail($id);

        $enrollment = $user ? Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first() : null;

        $isAdmin = $user && $user->role === 'admin';
        $isPaid = $enrollment && ($enrollment->payment_status === 'paid' || $enrollment->status === 'enrolled' || $enrollment->status === 'completed');
        $isCourseUnlocked = (bool) ($isAdmin || ($enrollment ? ($isPaid || !$course->requires_payment) : !$course->requires_payment));

        // Get user completed lesson IDs
        $userProgressRecords = $user ? LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->get()
            ->keyBy('lesson_id') : collect();

        $totalLessons = 0;
        $completedLessonsCount = 0;
        $allFlattenedLessons = [];

        // Flatten lessons in sequence to evaluate locking rules
        foreach ($course->sections as $section) {
            foreach ($section->lessons as $lesson) {
                $allFlattenedLessons[] = $lesson;
                $totalLessons++;
            }
        }

        $previousLessonCompleted = true; // First lesson is available if course unlocked
        $firstIncompleteLessonId = null;

        foreach ($course->sections as $section) {
            $sectionCompletedCount = 0;

            foreach ($section->lessons as $lesson) {
                $prog = $userProgressRecords->get($lesson->id);
                $isCompleted = $prog && $prog->status === 'completed';
                $watchPct = $prog ? $prog->progress_percentage : 0;

                if ($isCompleted) {
                    $sectionCompletedCount++;
                    $completedLessonsCount++;
                }

                // Sequence Lock Evaluation
                $isLocked = false;
                if (!$isAdmin) {
                    if (!$isCourseUnlocked) {
                        $isLocked = true;
                    } elseif ($course->progression_mode === 'sequential') {
                        if (!$previousLessonCompleted) {
                            $isLocked = true;
                        }
                    }
                }

                $lesson->is_completed = (bool) $isCompleted;
                $lesson->watch_percentage = $watchPct;
                $lesson->is_locked = $isLocked;

                if (!$isCompleted && !$firstIncompleteLessonId && !$isLocked) {
                    $firstIncompleteLessonId = $lesson->id;
                }

                $previousLessonCompleted = $isCompleted;
            }

            $sectionTotal = $section->lessons->count();
            $section->total_lessons = $sectionTotal;
            $section->completed_lessons = $sectionCompletedCount;
            $section->progress_percentage = $sectionTotal > 0 ? (int) round(($sectionCompletedCount / $sectionTotal) * 100) : 0;
        }

        $course->is_enrolled = (bool) $enrollment;
        $course->payment_status = $enrollment ? ($enrollment->payment_status ?? 'paid') : 'unpaid';
        $course->is_unlocked = $isCourseUnlocked;
        $course->enrollment_status = $enrollment ? $enrollment->status : null;
        $course->total_lessons = $totalLessons;
        $course->completed_lessons = $completedLessonsCount;
        $course->progress_percentage = $totalLessons > 0 ? (int) round(($completedLessonsCount / $totalLessons) * 100) : 0;
        $course->next_lesson_id = $firstIncompleteLessonId ?? ($allFlattenedLessons[0]->id ?? null);

        return response()->json($course);
    }

    public function getLesson(Request $request, $courseId, $lessonId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::with(['sections' => function ($q) {
            $q->orderBy('sort_order')->with(['lessons' => function ($lq) {
                $lq->orderBy('sort_order');
            }]);
        }])->findOrFail($courseId);

        $lesson = Lesson::with('section')->findOrFail($lessonId);

        $isAdmin = ($user->role === 'admin');
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        $isPaid = $enrollment && ($enrollment->payment_status === 'paid' || $enrollment->status === 'enrolled' || $enrollment->status === 'completed');
        $isCourseUnlocked = (bool) ($isAdmin || ($enrollment ? ($isPaid || !$course->requires_payment) : !$course->requires_payment));

        if (!$isCourseUnlocked && !$isAdmin) {
            return response()->json([
                'message' => 'Course is locked. Please unlock course with payment to access lessons.',
                'locked' => true,
            ], 403);
        }

        // Build flat ordered list of lessons to calculate previous & next IDs and lock states
        $flattened = [];
        foreach ($course->sections as $sec) {
            foreach ($sec->lessons as $les) {
                $flattened[] = $les;
            }
        }

        $currentIndex = -1;
        foreach ($flattened as $idx => $les) {
            if ($les->id == $lesson->id) {
                $currentIndex = $idx;
                break;
            }
        }

        $prevLesson = ($currentIndex > 0) ? $flattened[$currentIndex - 1] : null;
        $nextLesson = ($currentIndex >= 0 && $currentIndex < count($flattened) - 1) ? $flattened[$currentIndex + 1] : null;

        // Progress records
        $userProgress = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->get()
            ->keyBy('lesson_id');

        $videoWatch = VideoWatchProgress::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        // Enforce sequential lock check for students
        if (!$isAdmin && $course->progression_mode === 'sequential' && $currentIndex > 0) {
            $prevProg = $userProgress->get($prevLesson->id);
            if (!$prevProg || $prevProg->status !== 'completed') {
                return response()->json([
                    'message' => "Lesson is locked. Please complete '{$prevLesson->title}' first.",
                    'locked' => true,
                    'previous_lesson_id' => $prevLesson->id,
                ], 403);
            }
        }

        // Attach current progress
        $currentProg = $userProgress->get($lesson->id);
        $lesson->is_completed = (bool) ($currentProg && $currentProg->status === 'completed');
        $lesson->watch_percentage = $videoWatch ? $videoWatch->watch_percentage : 0;
        $lesson->current_position = $videoWatch ? $videoWatch->current_position : 0;
        $lesson->watched_intervals = $videoWatch ? ($videoWatch->watched_intervals ?? []) : [];

        $submission = LessonAssessmentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->orderByDesc('created_at')
            ->first();

        $lesson->assessment_submission = $submission ? [
            'id' => $submission->id,
            'status' => $submission->status,
            'answers' => $submission->answers,
            'score' => $submission->score,
            'teacher_notes' => $submission->teacher_notes,
            'created_at' => $submission->created_at,
        ] : null;

        // Annotate sidebar sections with current user's completion states
        $previousCompleted = true;
        foreach ($course->sections as $sec) {
            $secCompleted = 0;
            foreach ($sec->lessons as $les) {
                $lp = $userProgress->get($les->id);
                $isComp = (bool) ($lp && $lp->status === 'completed');
                if ($isComp) $secCompleted++;

                $isLck = false;
                if (!$isAdmin) {
                    if ($course->progression_mode === 'sequential' && !$previousCompleted) {
                        $isLck = true;
                    }
                }

                $les->is_completed = $isComp;
                $les->is_current = ($les->id == $lesson->id);
                $les->is_locked = $isLck;

                $previousCompleted = $isComp;
            }
            $secTotal = $sec->lessons->count();
            $sec->total_lessons = $secTotal;
            $sec->completed_lessons = $secCompleted;
            $sec->progress_percentage = $secTotal > 0 ? (int) round(($secCompleted / $secTotal) * 100) : 0;
        }

        $totalRequired = count($flattened);
        $totalCompleted = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'progression_mode' => $course->progression_mode,
                'progress_percentage' => $totalRequired > 0 ? (int) round(($totalCompleted / $totalRequired) * 100) : 0,
                'completed_lessons' => $totalCompleted,
                'total_lessons' => $totalRequired,
                'sections' => $course->sections,
            ],
            'lesson' => $lesson,
            'navigation' => [
                'previous_lesson_id' => $prevLesson ? $prevLesson->id : null,
                'next_lesson_id' => $nextLesson ? $nextLesson->id : null,
            ],
        ]);
    }

    public function submitAssessment(Request $request, $courseId, $lessonId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::findOrFail($courseId);
        $lesson = Lesson::findOrFail($lessonId);

        if ($lesson->section_id && $lesson->section) {
            $sectionCourseId = $lesson->section->course_id;
            if ((int) $sectionCourseId !== (int) $course->id) {
                return response()->json(['message' => 'Lesson does not belong to this course.'], 422);
            }
        }

        $request->validate([
            'answers' => 'required|array',
        ]);

        $submission = LessonAssessmentSubmission::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'course_id' => $course->id,
                'answers' => $request->answers,
                'status' => 'submitted',
            ]
        );

        LessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'section_id' => $lesson->section_id,
                'status' => 'completed',
                'progress_percentage' => 100,
                'completed_at' => now(),
                'last_accessed_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Assessment submitted successfully.',
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'answers' => $submission->answers,
                'created_at' => $submission->created_at,
            ],
        ]);
    }

    public function pay(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'nullable|string',
            'card_last_four' => 'nullable|string|max:4',
            'payer_name' => 'nullable|string|max:255',
            'payer_email' => 'nullable|email|max:255',
        ]);

        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::findOrFail($id);

        $amount = (float) $course->price;
        $currency = $course->currency ?? 'USD';
        $paymentMethod = $request->payment_method ?? 'card';
        $txnId = 'TXN-CL-' . strtoupper(Str::random(6)) . '-' . rand(1000, 9999);

        // Record payment
        $payment = Payment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'amount' => $amount,
            'currency' => $currency,
            'payment_method' => $paymentMethod,
            'transaction_id' => $txnId,
            'status' => 'completed',
            'payer_name' => $request->payer_name ?? $user->name,
            'payer_email' => $request->payer_email ?? $user->email,
            'card_last_four' => $request->card_last_four ?? '4242',
            'paid_at' => now(),
        ]);

        // Create or update enrollment
        $enrollment = Enrollment::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            [
                'status' => 'enrolled',
                'payment_status' => 'paid',
                'payment_id' => $payment->id,
            ]
        );

        // Send notification
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Payment Confirmed: ' . $course->title,
            'message' => 'Your payment of $' . number_format($amount, 2) . ' for "' . $course->title . '" was successful. Course unlocked! Receipt: ' . $txnId,
            'type' => 'payment',
            'is_read' => false,
        ]);

        AuditLog::log('course_payment', 'Course', $course->id, ['amount' => $amount, 'txn' => $txnId], $user->id);

        return response()->json([
            'message' => 'Payment successful! Course has been unlocked.',
            'enrollment' => $enrollment,
            'payment' => $payment,
        ]);
    }

    public function enroll(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::findOrFail($id);

        if ($course->requires_payment && (float) $course->price > 0 && $user->role !== 'admin') {
            return response()->json([
                'message' => 'This course requires payment to unlock. Please proceed with payment.',
                'requires_payment' => true,
                'price' => $course->price,
            ], 402);
        }

        $enrollment = Enrollment::firstOrCreate([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ], [
            'status' => 'enrolled',
            'payment_status' => 'paid',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'title' => 'Enrolled in ' . $course->title,
            'message' => 'You have successfully enrolled in ' . $course->title . '. Start your learning journey now!',
            'type' => 'enrollment',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Enrolled successfully in ' . $course->title,
            'enrollment' => $enrollment,
        ]);
    }
}
