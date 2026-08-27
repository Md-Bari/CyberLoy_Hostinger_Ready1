<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = ['module_id', 'title', 'description', 'order'];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function completions()
    {
        return $this->hasMany(TaskCompletion::class);
    }
}
