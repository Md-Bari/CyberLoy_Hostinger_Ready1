<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Announcement::with(['course', 'creator'])
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if ($request->has('course_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('course_id', $request->course_id)
                  ->orWhere('type', 'global');
            });
        }

        $announcements = $query->latest()->get();
        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin' && $user->role !== 'instructor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:global,course,urgent',
            'expires_at' => 'nullable|date',
        ]);

        $announcement = Announcement::create([
            'course_id' => $validated['course_id'] ?? null,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'type' => $validated['type'],
            'expires_at' => $validated['expires_at'] ?? null,
            'is_published' => true,
            'published_at' => now(),
        ]);

        return response()->json($announcement, 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::findOrFail($id);
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
