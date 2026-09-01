<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectTaskProgress extends Model
{
    use HasFactory;

    protected $table = 'project_task_progress';

    protected $fillable = [
        'project_plan_id',
        'project_task_id',
        'user_id',
        'progress_percentage',
        'status',
        'user_comments',
        'completed_at',
    ];

    protected $casts = [
        'progress_percentage' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function projectPlan()
    {
        return $this->belongsTo(ProjectPlan::class);
    }

    public function task()
    {
        return $this->belongsTo(ProjectTask::class, 'project_task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
