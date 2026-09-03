<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmergencySupport extends Model
{
    use HasFactory;

    protected $table = 'emergency_supports';

    protected $fillable = [
        'name',
        'email',
        'contact',
        'description',
        'status',
    ];
}
