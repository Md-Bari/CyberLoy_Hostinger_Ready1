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
