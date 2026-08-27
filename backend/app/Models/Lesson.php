<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_id',
        'title',
        'description',
        'content',
        'youtube_url',
        'youtube_video_id',
        'duration_seconds',
        'sort_order',
        'is_required',
        'completion_type',
        'required_watch_percentage',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'duration_seconds' => 'integer',
        'required_watch_percentage' => 'integer',
        'sort_order' => 'integer',
    ];

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function videoWatchProgress()
    {
        return $this->hasMany(VideoWatchProgress::class);
    }

    public static function extractYouTubeId(?string $url): ?string
    {
        if (!$url) return null;

        // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/v/ID
        if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i', $url, $matches)) {
            return $matches[1];
        }

        // If user directly inputs 11-char ID
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', trim($url))) {
            return trim($url);
        }

        return null;
    }
}
