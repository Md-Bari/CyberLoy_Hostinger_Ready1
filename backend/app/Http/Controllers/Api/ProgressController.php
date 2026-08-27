<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function toggleTask(Request $request, $id)
    {
        $user = auth('sanctum')->user() ?? $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated access.'], 401);
        }

        $task = Task::with('module.course')->findOrFail($id);
        $course = $task->module->course;

        // Check if user is enrolled and has paid if payment is required
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        $isUnlocked = $enrollment && (!$course->requires_payment || $enrollment->payment_status === 'paid' || $enrollment->status === 'enrolled' || $enrollment->status === 'completed');

        if (!$isUnlocked) {
            return response()->json([
                'message' => 'Course is locked. Please complete payment to unlock tasks and record progress.',
                'locked' => true,
            ], 403);
        }

        $completion = TaskCompletion::where('user_id', $user->id)
            ->where('task_id', $task->id)
            ->first();

        if ($completion) {
            $completion->delete();
            $completed = false;
        } else {
            TaskCompletion::create([
                'user_id' => $user->id,
                'task_id' => $task->id,
            ]);
            $completed = true;
        }

        // Recalculate progress % for the course
        $totalTasks = $course->tasks()->count();
        $taskIds = $course->tasks()->pluck('tasks.id');
        $completedCount = TaskCompletion::where('user_id', $user->id)
            ->whereIn('task_id', $taskIds)
            ->count();

        $progressPercentage = $totalTasks > 0 ? round(($completedCount / $totalTasks) * 100) : 0;

        // Auto update enrollment status if 100%
        if ($progressPercentage === 100) {
            $enrollment->update(['status' => 'completed', 'completed_at' => now()]);
        } else {
            $enrollment->update(['status' => 'enrolled', 'completed_at' => null]);
        }

        return response()->json([
            'completed' => $completed,
            'progress_percentage' => $progressPercentage,
            'completed_tasks' => $completedCount,
            'total_tasks' => $totalTasks,
        ]);
    }
}
