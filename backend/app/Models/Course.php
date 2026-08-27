<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'price',
        'currency',
        'requires_payment',
        'level',
        'instructor_name',
        'category',
        'duration',
        'prerequisites',
        'learning_objectives',
        'progression_mode',
        'status',
        'is_published',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'requires_payment' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function sections()
    {
        return $this->hasMany(CourseSection::class, 'course_id')->orderBy('sort_order');
    }

    public function modules()
    {
        return $this->hasMany(CourseSection::class, 'course_id')->orderBy('sort_order');
    }

    public function lessons()
    {
        return $this->hasManyThrough(Lesson::class, CourseSection::class, 'course_id', 'section_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
