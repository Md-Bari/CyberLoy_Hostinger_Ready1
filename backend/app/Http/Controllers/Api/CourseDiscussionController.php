<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseDiscussion;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class CourseDiscussionController extends Controller
{
    private function canAccess(Course $course, $user): bool
    {
        if ($user->role === 'admin' || (int) $course->instructor_id === (int) $user->id) {
            return true;
        }

        $enrollment = Enrollment::where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->first();

        return $enrollment && (!$course->requires_payment || $enrollment->payment_status === 'paid');
    }

    public function index(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        abort_unless($this->canAccess($course, $request->user()), 403, 'Enroll in this course to join its discussion.');

        $query = CourseDiscussion::with(['user:id,name,role', 'replies.user:id,name,role'])
            ->where('course_id', $course->id)
            ->whereNull('parent_id');

        if ($request->has('lesson_id')) {
            $query->where('lesson_id', $request->lesson_id);
        }

        return $query->latest()->paginate(30);
    }

    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        abort_unless($this->canAccess($course, $request->user()), 403, 'Enroll in this course to join its discussion.');

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
            'parent_id' => 'nullable|integer|exists:course_discussions,id',
            'lesson_id' => 'nullable|exists:lessons,id',
        ]);

        if (!empty($validated['parent_id'])) {
            $parent = CourseDiscussion::findOrFail($validated['parent_id']);
            abort_unless((int) $parent->course_id === (int) $course->id && $parent->parent_id === null, 422, 'Replies must reference a discussion in this course.');
        }

        $discussion = CourseDiscussion::create([
            'course_id' => $course->id,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'lesson_id' => $validated['lesson_id'] ?? null,
            'body' => $validated['body'],
        ]);

        return response()->json($discussion->load('user:id,name,role'), 201);
    }
}
