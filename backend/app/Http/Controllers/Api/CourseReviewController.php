<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseReview;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class CourseReviewController extends Controller
{
    public function index($courseId)
    {
        $reviews = CourseReview::with('user:id,name')
            ->where('course_id', $courseId)
            ->where('is_approved', true)
            ->latest()
            ->get();
        return response()->json($reviews);
    }

    public function store(Request $request, $courseId)
    {
        $user = $request->user();
        $enrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'completed')
            ->exists();

        if (!$enrolled) {
            return response()->json(['message' => 'You can only review courses you have completed.'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'review' => 'nullable|string|max:2000',
        ]);

        $review = CourseReview::updateOrCreate(
            ['user_id' => $user->id, 'course_id' => $courseId],
            [
                'rating' => $validated['rating'],
                'title' => $validated['title'] ?? null,
                'review' => $validated['review'] ?? null,
                'is_approved' => true,
            ]
        );

        return response()->json($review, 201);
    }
}
