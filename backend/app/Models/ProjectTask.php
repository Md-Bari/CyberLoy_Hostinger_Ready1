<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_plan_id',
        'phase',
        'prefix',
        'title',
        'details',
        'comments',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function projectPlan()
    {
        return $this->belongsTo(ProjectPlan::class);
    }

    public function userProgress()
    {
        return $this->hasMany(ProjectTaskProgress::class);
    }
}
