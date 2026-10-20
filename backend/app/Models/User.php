<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    use HasFactory, Notifiable, MustVerifyEmailTrait;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
        ];
    }

    public function isInstructor(): bool
    {
        return $this->role === 'instructor';
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification());
    }

    // ─── JWTSubject interface ───────────────────────────────────────────────
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
        ];
    }

    // ─── Helpers ────────────────────────────────────────────────────────────
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function instructedCourses()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function taskCompletions()
    {
        return $this->hasMany(TaskCompletion::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function assignedProjectPlans()
    {
        return $this->belongsToMany(ProjectPlan::class, 'project_assignments', 'user_id', 'project_plan_id');
    }
}
