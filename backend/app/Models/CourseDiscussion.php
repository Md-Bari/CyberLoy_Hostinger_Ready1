<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseDiscussion extends Model
{
    protected $fillable = ['course_id', 'user_id', 'parent_id', 'body'];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(self::class, 'parent_id')->oldest();
    }
}
