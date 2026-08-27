<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    use HasFactory;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'course_id',
        'section_id',
        'lesson_id',
        'status',
        'progress_percentage',
        'watched_seconds',
        'started_at',
        'completed_at',
        'last_accessed_at',
    ];

    protected $casts = [
        'progress_percentage' => 'integer',
        'watched_seconds' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_accessed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
