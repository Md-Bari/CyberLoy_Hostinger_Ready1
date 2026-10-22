<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonAssessmentSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'answers',
        'question_results',
        'file_urls',
        'submission_text',
        'score',
        'status',
        'teacher_notes',
        'attempt_number',
        'passed',
    ];

    protected $casts = [
        'answers' => 'array',
        'question_results' => 'array',
        'file_urls' => 'array',
        'score' => 'integer',
        'attempt_number' => 'integer',
        'passed' => 'boolean',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
