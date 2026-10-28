<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function uploadAssignment(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20480|mimes:pdf,doc,docx,txt,zip,jpg,jpeg,png,webp',
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('assignments', $filename, 'public');

        $url = Storage::url($path);
        return response()->json([
            'url' => $url,
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Course poster / thumbnail. Served back through showCourseImage() under
     * /api/media so it works behind the dev proxy and in production without a
     * public/storage symlink.
     */
    public function uploadCourseImage(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin' && $user->role !== 'instructor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120|dimensions:min_width=400,min_height=225',
        ], [
            'file.dimensions' => 'The image must be at least 400 × 225 pixels.',
        ]);

        $file = $request->file('file');
        $filename = Str::uuid() . '.' . strtolower($file->extension());
        $file->storeAs(self::COURSE_IMAGE_DIR, $filename, 'public');

        return response()->json([
            'url' => '/api/media/course-images/' . $filename,
            'filename' => $file->getClientOriginalName(),
        ], 201);
    }

    public function showCourseImage(string $file)
    {
        // Filenames are generated UUIDs; reject anything else (no path traversal).
        if (!preg_match('/^[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/', $file)) {
            abort(404);
        }

        $disk = Storage::disk('public');
        $path = self::COURSE_IMAGE_DIR . '/' . $file;
        if (!$disk->exists($path)) {
            abort(404);
        }

        return response()->file($disk->path($path), [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    /** Remove a previously uploaded poster when a course's image is replaced or cleared. */
    public static function deleteCourseImage(?string $url): void
    {
        if ($url && preg_match('#^/api/media/course-images/([a-f0-9-]{36}\.(jpg|jpeg|png|webp))$#', $url, $m)) {
            Storage::disk('public')->delete(self::COURSE_IMAGE_DIR . '/' . $m[1]);
        }
    }

    private const COURSE_IMAGE_DIR = 'course-images';

    public function uploadLessonResource(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin' && $user->role !== 'instructor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:51200|mimes:pdf,doc,docx,ppt,pptx,txt,zip,mp4,webm',
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('lesson-resources', $filename, 'public');

        return response()->json([
            'url' => Storage::url($path),
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
        ]);
    }
}
