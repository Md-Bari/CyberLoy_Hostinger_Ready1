<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAssessmentSubmission;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Notification;
use App\Models\AuditLog;
use App\Services\CourseCompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;


class CourseController extends Controller
{
    protected function getAuthenticatedUser(Request $request)
    {
        return auth('api')->user() ?? $request->user();
    }

    private function hideAssessmentAnswers(Course $course): Course
    {
        foreach ($course->sections as $section) {
            foreach ($section->lessons as $lesson) {
                $config = $lesson->assessment_config ?? [];
                $questions = $config['questions'] ?? (array_is_list($config) ? $config : []);
                foreach ($questions as &$question) {
                    if (is_array($question)) {
                        unset($question['correct_answer'], $question['answer_key'], $question['is_correct']);
                    }
                }
                unset($question);
                $lesson->assessment_config = array_is_list($config)
                    ? $questions
                    : array_merge($config, ['questions' => $questions]);
            }
        }

        return $course;
    }

    private function hideLockedLessonContent(Course $course, bool $unlocked): Course
    {
        if (!$unlocked) {
            foreach ($course->sections as $section) {
                foreach ($section->lessons as $lesson) {
                    $lesson->setAttribute('content', null);
                    $lesson->setAttribute('youtube_url', null);
                    $lesson->setAttribute('youtube_video_id', null);
                    $lesson->setAttribute('pdf_url', null);
                    $lesson->setAttribute('assessment_config', null);
                }
            }
        }

        return $course;
    }

    private function completeStripePayment(array $session): bool
    {
        if (($session['payment_status'] ?? null) !== 'paid'
            || ($session['mode'] ?? null) !== 'payment'
            || empty($session['id'])) {
            return false;
        }

        $payment = Payment::where('checkout_session_id', $session['id'])->first();
        if (!$payment
            || (int) ($session['metadata']['user_id'] ?? 0) !== (int) $payment->user_id
            || (int) ($session['metadata']['course_id'] ?? 0) !== (int) $payment->course_id
            || (int) ($session['amount_total'] ?? -1) !== (int) round(((float) $payment->amount) * 100)
            || strtolower((string) ($session['currency'] ?? '')) !== strtolower($payment->currency)) {
            return false;
        }

        return DB::transaction(function () use ($payment, $session) {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($payment->status === 'completed') {
                return true;
            }

            $payment->update([
                'status' => 'completed',
                'transaction_id' => $session['payment_intent'] ?? $session['id'],
                'payment_method' => 'stripe',
                'paid_at' => now(),
            ]);

            Enrollment::updateOrCreate(
                ['user_id' => $payment->user_id, 'course_id' => $payment->course_id],
                [
                    'status' => 'enrolled',
                    'payment_status' => 'paid',
                    'payment_id' => $payment->id,
                ]
            );

            $course = Course::findOrFail($payment->course_id);
            Notification::create([
                'user_id' => $payment->user_id,
                'title' => 'Payment confirmed: ' . $course->title,
                'message' => 'Your payment of ' . strtoupper($payment->currency) . ' '
                    . number_format((float) $payment->amount, 2)
                    . ' for "' . $course->title . '" was successful.',
                'type' => 'payment',
                'is_read' => false,
            ]);
            AuditLog::log('stripe_payment_completed', 'Payment', $payment->id, [
                'course_id' => $payment->course_id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
            ], $payment->user_id);

            return true;
        });
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
            $this->hideAssessmentAnswers($course);
            if ($user) {
                $enrollment = Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->first();

                $isPaid = $enrollment && $enrollment->payment_status === 'paid';
                $isUnlocked = (bool) ($user->role === 'admin'
                    || ($user->role === 'instructor' && (int) $course->instructor_id === (int) $user->id)
                    || ($enrollment ? ($isPaid || !$course->requires_payment) : !$course->requires_payment));

                $course->is_enrolled = (bool) $enrollment;
                $course->payment_status = $enrollment ? ($enrollment->payment_status ?? 'paid') : 'unpaid';
                $course->is_unlocked = $isUnlocked;
                $course->enrollment_status = $enrollment ? $enrollment->status : null;
                $this->hideLockedLessonContent($course, $isUnlocked);

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
        $isCourseInstructor = $user && $user->role === 'instructor'
            && (int) $course->instructor_id === (int) $user->id;
        if ($course->status !== 'published' && (!$user || ($user->role !== 'admin' && !$isCourseInstructor))) {
            abort(404);
        }

        $enrollment = $user ? Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first() : null;

        $isAdmin = $user && ($user->role === 'admin'
            || ($user->role === 'instructor' && (int) $course->instructor_id === (int) $user->id));
        $isPaid = $enrollment && $enrollment->payment_status === 'paid';
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

        $this->hideLockedLessonContent($course, $isCourseUnlocked);
        return response()->json($this->hideAssessmentAnswers($course));
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
        $isCourseInstructor = $user->role === 'instructor'
            && (int) $course->instructor_id === (int) $user->id;
        if ($course->status !== 'published' && $user->role !== 'admin' && !$isCourseInstructor) {
            abort(404);
        }

        $lesson = Lesson::with('section')->findOrFail($lessonId);

        $isAdmin = ($user->role === 'admin'
            || ($user->role === 'instructor' && (int) $course->instructor_id === (int) $user->id));
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        $isPaid = $enrollment && $enrollment->payment_status === 'paid';
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
        if ($currentIndex < 0) {
            abort(404);
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
            'passed' => $submission->passed,
            'attempt_number' => $submission->attempt_number,
            'teacher_notes' => $submission->teacher_notes,
            'created_at' => $submission->created_at,
        ] : null;
        $this->hideAssessmentAnswers($course);
        $config = $lesson->assessment_config ?? [];
        $questions = $config['questions'] ?? (array_is_list($config) ? $config : []);
        foreach ($questions as &$question) {
            if (is_array($question)) {
                unset($question['correct_answer'], $question['answer_key'], $question['is_correct']);
            }
        }
        unset($question);
        $lesson->assessment_config = array_is_list($config)
            ? $questions
            : array_merge($config, ['questions' => $questions]);
        $lesson->assessment_attempts_used = LessonAssessmentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)->count();

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
        if ($course->status !== 'published') {
            abort(404);
        }

        if ((int) $lesson->section?->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Lesson does not belong to this course.'], 422);
        }
        if (!$lesson->assessment_type || $lesson->assessment_type === 'none') {
            return response()->json(['message' => 'This lesson has no assessment to submit.'], 422);
        }

        $request->validate([
            'answers' => 'required_without:file_urls|array|min:1',
            'answers.*' => 'nullable|string|max:10000',
            'file_urls' => 'nullable|array',
            'file_urls.*' => 'string|max:1000',
            'submission_text' => 'nullable|string|max:10000',
        ]);

        if (!in_array($user->role, ['user', 'student'], true)) {
            return response()->json(['message' => 'Only learners may submit assessments.'], 403);
        }

        $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->first();
        if ($course->requires_payment && (!$enrollment || $enrollment->payment_status !== 'paid')) {
            return response()->json(['message' => 'A paid enrollment is required to submit this assessment.'], 403);
        }

        if ($course->progression_mode === 'sequential') {
            $orderedLessons = $course->sections()
                ->with(['lessons' => fn ($query) => $query->orderBy('sort_order')])
                ->orderBy('sort_order')
                ->get()
                ->flatMap(fn ($section) => $section->lessons)
                ->values();
            $currentIndex = $orderedLessons->search(fn ($item) => (int) $item->id === (int) $lesson->id);
            if ($currentIndex === false) {
                return response()->json(['message' => 'Lesson does not belong to this course.'], 422);
            }
            if ($currentIndex > 0) {
                $previousLesson = $orderedLessons[$currentIndex - 1];
                $previousCompleted = LessonProgress::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('lesson_id', $previousLesson->id)
                    ->where('status', 'completed')
                    ->exists();
                if (!$previousCompleted) {
                    return response()->json(['message' => 'Complete the previous lesson before submitting this assessment.'], 403);
                }
            }
        }

        $questions = $lesson->assessment_config['questions'] ?? $lesson->assessment_config ?? [];
        if (!is_array($questions) || count($questions) === 0) {
            return response()->json(['message' => 'This assessment has no questions configured.'], 422);
        }

        $maxAttempts = (int) ($lesson->assessment_config['max_attempts'] ?? 3);

        $answers = $request->answers ?? [];
        if ($lesson->assessment_type === 'mcq' && count($answers) !== count($questions)) {
            return response()->json(['message' => 'Please answer every assessment question.'], 422);
        }

        $score = null;
        $passed = false;
        $status = 'submitted';
        if ($lesson->assessment_type === 'mcq') {
            $correct = 0;
            foreach (array_values($questions) as $index => $question) {
                if (!is_array($question) || !array_key_exists('correct_answer', $question)) {
                    return response()->json(['message' => 'MCQ questions must have a configured correct_answer.'], 422);
                }
                if (!isset($question['options']) || !is_array($question['options'])
                    || !in_array($question['correct_answer'], $question['options'], true)) {
                    return response()->json(['message' => 'MCQ answer keys must match one of the configured options.'], 422);
                }
                if (isset($request->answers[$index])
                    && (string) $request->answers[$index] === (string) $question['correct_answer']) {
                    $correct++;
                }
            }
            $score = (int) round(($correct / count($questions)) * 100);
            $passingScore = (int) ($lesson->assessment_config['passing_score'] ?? 70);
            $passed = $score >= $passingScore;
            $status = 'reviewed';
        }

        $submission = DB::transaction(function () use ($user, $course, $lesson, $request, $maxAttempts, $score, $passed, $status) {
            DB::table('users')->where('id', $user->id)->lockForUpdate()->first();

            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();
            if ($course->requires_payment && (!$enrollment || $enrollment->payment_status !== 'paid')) {
                abort(403, 'A paid enrollment is required to submit this assessment.');
            }

            if ($lesson->assessment_type === 'written'
                && LessonAssessmentSubmission::where('user_id', $user->id)
                    ->where('lesson_id', $lesson->id)
                    ->where('status', 'submitted')
                    ->exists()) {
                abort(409, 'Your previous written submission is still awaiting instructor review.');
            }

            $attempts = LessonAssessmentSubmission::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->count();
            if ($attempts >= $maxAttempts) {
                abort(422, 'You have used all attempts for this assessment.');
            }

            return LessonAssessmentSubmission::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'answers' => $request->answers ?? [],
                'file_urls' => $request->file_urls ?? [],
                'submission_text' => $request->submission_text ?? null,
                'score' => $score,
                'passed' => $passed,
                'attempt_number' => $attempts + 1,
                'status' => $status,
            ]);
        });

        if ($passed) {
            $videoComplete = !$lesson->youtube_video_id
                && $lesson->completion_type !== 'video'
                || VideoWatchProgress::where('user_id', $user->id)
                    ->where('lesson_id', $lesson->id)
                    ->where('completed', true)
                    ->exists();
            if ($videoComplete) {
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
            }
            $completion = CourseCompletionService::refresh($course, $user);
            if (($completion['is_complete'] ?? false) && ($course->certificate_auto_issue ?? true)) {
                $this->autoIssueCertificate($course, $user);
            }
        }

        return response()->json([
            'message' => $passed ? 'Assessment passed.' : 'Assessment submitted for review or another attempt.',
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'score' => $submission->score,
                'passed' => $submission->passed,
                'attempt_number' => $submission->attempt_number,
                'created_at' => $submission->created_at,
            ],
        ]);
    }

    public function pay(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::findOrFail($id);
        if ($course->status !== 'published' && $user->role !== 'admin') {
            abort(404);
        }

        if (!config('lms.stripe_secret')) {
            return response()->json(['message' => 'Stripe checkout is not configured on this server.'], 503);
        }

        if (!$course->requires_payment || (float) $course->price <= 0) {
            return response()->json(['message' => 'This course does not require payment.'], 422);
        }
        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->where('payment_status', 'paid')->exists()) {
            return response()->json(['message' => 'You already have paid access to this course.'], 409);
        }
        if (!preg_match('/^[A-Z]{3}$/i', (string) ($course->currency ?? 'USD'))) {
            return response()->json(['message' => 'This course has an invalid payment currency.'], 422);
        }

        $amount = (float) $course->price;
        $currency = strtolower($course->currency ?? 'USD');
        $pendingId = 'pending-' . Str::uuid();
        $payment = Payment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'amount' => $amount,
            'currency' => strtoupper($currency),
            'payment_method' => 'stripe',
            'transaction_id' => $pendingId,
            'status' => 'pending',
            'payer_name' => $user->name,
            'payer_email' => $user->email,
        ]);

        Enrollment::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            ['status' => 'enrolled', 'payment_status' => 'pending', 'payment_id' => $payment->id]
        );

        $frontend = rtrim(config('lms.frontend_url'), '/');
        $response = Http::asForm()
            ->withToken(config('lms.stripe_secret'))
            ->withHeaders(['Idempotency-Key' => 'lms-checkout-' . $payment->id])
            ->timeout(15)
            ->post(
            'https://api.stripe.com/v1/checkout/sessions',
            [
                'mode' => 'payment',
                'success_url' => $frontend . '/courses/' . $course->id . '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $frontend . '/courses/' . $course->id . '?checkout=cancelled',
                'client_reference_id' => (string) $user->id,
                'customer_email' => $user->email,
                'line_items[0][quantity]' => 1,
                'line_items[0][price_data][currency]' => $currency,
                'line_items[0][price_data][unit_amount]' => (int) round($amount * 100),
                'line_items[0][price_data][product_data][name]' => $course->title,
                'metadata[user_id]' => (string) $user->id,
                'metadata[course_id]' => (string) $course->id,
            ]
        );

        if (!$response->successful() || empty($response->json('id')) || empty($response->json('url'))) {
            $payment->update(['status' => 'failed']);
            return response()->json(['message' => 'Stripe could not create a checkout session. Try again later.'], 502);
        }

        $payment->update(['checkout_session_id' => $response->json('id')]);

        return response()->json([
            'checkout_url' => $response->json('url'),
            'status' => 'pending',
            'payment' => $payment,
        ]);
    }

    public function checkoutStatus(Request $request, $sessionId)
    {
        $payment = Payment::where('checkout_session_id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($payment->status !== 'completed') {
            if (!config('lms.stripe_secret')) {
                return response()->json(['message' => 'Stripe checkout is not configured on this server.'], 503);
            }
            $response = Http::withToken(config('lms.stripe_secret'))
                ->timeout(15)
                ->get('https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
            if (!$response->successful()) {
                return response()->json(['message' => 'Unable to confirm checkout status with Stripe.'], 502);
            }
            $this->completeStripePayment($response->json());
            $payment->refresh();
        }

        return response()->json(['status' => $payment->status]);
    }

    public function stripeWebhook(Request $request)
    {
        $secret = config('lms.stripe_webhook_secret');
        if (!$secret) {
            return response()->json(['message' => 'Stripe webhook is not configured.'], 503);
        }

        $signatureHeader = $request->header('Stripe-Signature', '');
        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            [$key, $value] = array_pad(explode('=', $part, 2), 2, null);
            if ($key && $value) {
                $parts[$key][] = $value;
            }
        }

        $timestamp = (int) ($parts['t'][0] ?? 0);
        $expected = hash_hmac('sha256', $timestamp . '.' . $request->getContent(), $secret);
        $signatureValid = false;
        $signatureFresh = $timestamp > 0 && abs(time() - $timestamp) <= 300;
        foreach ($parts['v1'] ?? [] as $signature) {
            if ($signatureFresh && hash_equals($expected, $signature)) {
                $signatureValid = true;
                break;
            }
        }
        if (!$signatureValid) {
            return response()->json(['message' => 'Invalid Stripe webhook signature.'], 400);
        }

        $event = $request->json()->all();
        if (in_array($event['type'] ?? '', ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
            $session = $event['data']['object'] ?? [];
            if (!$this->completeStripePayment($session)) {
                return response()->json(['message' => 'The payment session did not match an eligible order.'], 422);
            }
        }

        return response()->json(['received' => true]);
    }

    public function enroll(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $course = Course::findOrFail($id);
        if ($course->status !== 'published' && $user->role !== 'admin') {
            abort(404);
        }

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

    private function autoIssueCertificate(Course $course, $user)
    {
        $existing = \App\Models\Certificate::where('user_id', $user->id)->where('course_id', $course->id)->exists();
        if ($existing) {
            return;
        }

        $code = 'CERT-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(6)) . '-' . rand(100, 999);
        $verCode = 'VER-' . strtoupper(\Illuminate\Support\Str::random(4)) . '-' . strtoupper(\Illuminate\Support\Str::random(4));

        \App\Models\Certificate::create([
            'certificate_code' => $code,
            'verification_code' => $verCode,
            'user_id' => $user->id,
            'course_id' => $course->id,
            'issued_by' => 1,
            'issued_at' => now(),
            'completion_date' => now(),
            'status' => 'issued',
            'auto_issued' => true,
        ]);

        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Official Certificate Issued!',
            'message' => 'Congratulations! Your certificate for "' . $course->title . '" has been automatically issued. Certificate Code: ' . $code,
            'type' => 'certificate_issued',
            'is_read' => false,
        ]);
    }
}
