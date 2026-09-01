<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_plan_id',
        'user_id',
        'assigned_at',
        'due_date',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'due_date' => 'date',
    ];

    public function projectPlan()
    {
        return $this->belongsTo(ProjectPlan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
