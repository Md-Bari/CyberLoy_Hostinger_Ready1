<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LessonNote;
use Illuminate\Http\Request;

class LessonNoteController extends Controller
{
    public function index(Request $request, $lessonId)
    {
        $user = $request->user();
        $notes = LessonNote::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'course_id' => 'required|exists:courses,id',
            'timestamp_seconds' => 'nullable|integer|min:0',
            'note' => 'required|string|max:10000',
        ]);

        $note = LessonNote::create([
            'user_id' => $user->id,
            'lesson_id' => $validated['lesson_id'],
            'course_id' => $validated['course_id'],
            'timestamp_seconds' => $validated['timestamp_seconds'] ?? null,
            'note' => $validated['note'],
        ]);

        return response()->json($note, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $note = LessonNote::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $validated = $request->validate(['note' => 'required|string|max:10000']);
        $note->update(['note' => $validated['note']]);
        return response()->json($note);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $note = LessonNote::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $note->delete();
        return response()->json(['message' => 'Note deleted']);
    }
}
