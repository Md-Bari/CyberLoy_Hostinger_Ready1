<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseLiveSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'room_name',
        'host_name',
        'status',
        'starts_at',
        'ends_at',
        'join_url',
        'share_url',
        'created_by',
    ];

    protected $appends = ['join_url', 'share_url'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    // Join links carry no credentials; each user fetches their own LiveKit token
    // from POST /live-sessions/{id}/join. This also replaces old stored token links.
    public function getJoinUrlAttribute(): string
    {
        return rtrim((string) config('lms.frontend_url'), '/') . '/live-class?session=' . $this->id;
    }

    public function getShareUrlAttribute(): string
    {
        return $this->join_url;
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
