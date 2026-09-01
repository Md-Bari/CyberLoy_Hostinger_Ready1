<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoWatchProgress extends Model
{
    use HasFactory;

    protected $table = 'video_watch_progress';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'video_id',
        'current_position',
        'duration',
        'watch_percentage',
        'watched_seconds',
        'watched_intervals',
        'last_heartbeat',
        'completed',
        'completed_at',
    ];

    protected $casts = [
        'watched_intervals' => 'array',
        'completed'         => 'boolean',
        'current_position'  => 'integer',
        'duration'          => 'integer',
        'watch_percentage'  => 'integer',
        'watched_seconds'   => 'integer',
        'last_heartbeat'    => 'datetime',
        'completed_at'      => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Merge a new watched interval [start, end] into existing intervals and calculate unique watched seconds.
     */
    public static function mergeIntervals(array $existingIntervals, int $start, int $end): array
    {
        if ($end <= $start) {
            return $existingIntervals;
        }

        // Add new interval
        $intervals = $existingIntervals;
        $intervals[] = [$start, $end];

        // Sort intervals by start time
        usort($intervals, function ($a, $b) {
            return $a[0] <=> $b[0];
        });

        // Merge overlapping or consecutive intervals
        $merged = [];
        foreach ($intervals as $interval) {
            if (empty($merged)) {
                $merged[] = $interval;
                continue;
            }

            $lastIndex = count($merged) - 1;
            $last = $merged[$lastIndex];

            // If current interval overlaps or is adjacent (within 2 seconds tolerance)
            if ($interval[0] <= $last[1] + 2) {
                $merged[$lastIndex] = [$last[0], max($last[1], $interval[1])];
            } else {
                $merged[] = $interval;
            }
        }

        return $merged;
    }

    /**
     * Calculate total unique seconds watched from merged intervals.
     */
    public static function calculateTotalSeconds(array $intervals): int
    {
        $total = 0;
        foreach ($intervals as $interval) {
            $total += max(0, $interval[1] - $interval[0]);
        }
        return $total;
    }
}
