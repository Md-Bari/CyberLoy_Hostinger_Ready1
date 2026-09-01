<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'standard',
        'description',
        'company_name',
        'project_owner',
        'start_date',
        'target_date',
        'weeks_duration',
        'created_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'weeks_duration' => 'integer',
        'start_date' => 'date',
        'target_date' => 'date',
    ];

    public function tasks()
    {
        return $this->hasMany(ProjectTask::class)->orderBy('sort_order');
    }

    public function assignments()
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'project_assignments', 'project_plan_id', 'user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
