<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectPlan;
use App\Models\ProjectTask;
use App\Models\ProjectAssignment;
use App\Models\ProjectTaskProgress;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectTaskController extends Controller
{
    protected function getAuthenticatedUser(Request $request)
    {
        return auth('api')->user() ?? $request->user();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * List all system users for assignment (Admin)
     */
    public function getUsersList(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }

    /**
     * List all project plans (Admin)
     */
    public function indexAdmin(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plans = ProjectPlan::withCount(['tasks', 'assignments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['plans' => $plans]);
    }


    /**
     * Get single project plan detail (Admin)
     */
    public function showPlanAdmin(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plan = ProjectPlan::with(['tasks' => function ($q) {
            $q->orderBy('sort_order');
        }, 'assignedUsers'])->findOrFail($id);

        // Fetch all progress records for assigned users
        $assignedUserIds = $plan->assignedUsers->pluck('id')->toArray();
        $progressRecords = ProjectTaskProgress::where('project_plan_id', $plan->id)
            ->get()
            ->groupBy('user_id');

        // Build user progress summaries
        $userSummaries = $plan->assignedUsers->map(function ($assignedUser) use ($plan, $progressRecords) {
            $userProgs = $progressRecords->get($assignedUser->id, collect());
            $totalTasks = $plan->tasks->count();
            $completedTasks = $userProgs->where('status', 'completed')->count();
            $avgProgress = $totalTasks > 0 ? (int) round($userProgs->sum('progress_percentage') / $totalTasks) : 0;

            return [
                'user' => $assignedUser,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'overall_progress' => $avgProgress,
            ];
        });

        return response()->json([
            'plan' => $plan,
            'user_summaries' => $userSummaries,
        ]);
    }

    /**
     * Create new project plan (Admin)
     */
    public function storePlan(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'standard' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'company_name' => 'nullable|string',
            'project_owner' => 'nullable|string',
            'weeks_duration' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'target_date' => 'nullable|date',
        ]);

        $plan = ProjectPlan::create([
            'title' => $request->title,
            'standard' => $request->standard ?? 'ISO 27001',
            'description' => $request->description,
            'company_name' => $request->company_name,
            'project_owner' => $request->project_owner,
            'weeks_duration' => $request->weeks_duration ?? 12,
            'start_date' => $request->start_date,
            'target_date' => $request->target_date,
            'created_by' => $user->id,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Project Plan created successfully',
            'plan' => $plan,
        ], 201);
    }

    /**
     * Update project plan (Admin)
     */
    public function updatePlan(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plan = ProjectPlan::findOrFail($id);
        $plan->update($request->only([
            'title', 'standard', 'description', 'company_name',
            'project_owner', 'weeks_duration', 'start_date', 'target_date', 'is_active'
        ]));

        return response()->json([
            'message' => 'Project Plan updated successfully',
            'plan' => $plan,
        ]);
    }

    /**
     * Delete project plan (Admin)
     */
    public function deletePlan(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plan = ProjectPlan::findOrFail($id);
        $plan->delete();

        return response()->json(['message' => 'Project Plan deleted successfully']);
    }

    /**
     * Add task to project plan (Admin)
     */
    public function storeTask(Request $request, $planId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plan = ProjectPlan::findOrFail($planId);

        $request->validate([
            'phase' => 'required|string',
            'title' => 'required|string',
            'prefix' => 'nullable|string',
            'details' => 'nullable|string',
            'comments' => 'nullable|string',
        ]);

        $maxOrder = $plan->tasks()->max('sort_order') ?? 0;

        $task = ProjectTask::create([
            'project_plan_id' => $plan->id,
            'phase' => $request->phase,
            'prefix' => $request->prefix,
            'title' => $request->title,
            'details' => $request->details,
            'comments' => $request->comments,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json([
            'message' => 'Task added successfully',
            'task' => $task,
        ], 201);
    }

    /**
     * Update task (Admin)
     */
    public function updateTask(Request $request, $taskId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $task = ProjectTask::findOrFail($taskId);
        $task->update($request->only(['phase', 'prefix', 'title', 'details', 'comments', 'sort_order']));

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Delete task (Admin)
     */
    public function deleteTask(Request $request, $taskId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $task = ProjectTask::findOrFail($taskId);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Assign / Unassign users to project plan (Admin)
     */
    public function assignUsers(Request $request, $planId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $plan = ProjectPlan::findOrFail($planId);
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $plan->assignedUsers()->sync($request->user_ids);

        return response()->json([
            'message' => 'Assigned users updated successfully',
            'assigned_users' => $plan->fresh('assignedUsers')->assignedUsers,
        ]);
    }

    /**
     * Admin updates a student's task progress percentage / comments
     */
    public function adminUpdateUserProgress(Request $request, $planId, $userId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        $request->validate([
            'task_id' => 'required|exists:project_tasks,id',
            'progress_percentage' => 'required|integer|min:0|max:100',
            'comments' => 'nullable|string',
        ]);

        $pct = (int) $request->progress_percentage;
        $status = $pct >= 100 ? 'completed' : ($pct > 0 ? 'in_progress' : 'not_started');

        $prog = ProjectTaskProgress::updateOrCreate(
            [
                'project_plan_id' => $planId,
                'project_task_id' => $request->task_id,
                'user_id' => $userId,
            ],
            [
                'progress_percentage' => $pct,
                'status' => $status,
                'user_comments' => $request->comments,
                'completed_at' => $pct >= 100 ? now() : null,
            ]
        );

        return response()->json([
            'message' => 'User progress updated by admin',
            'progress' => $prog,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STUDENT / USER ENDPOINTS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * List assigned project plans for current student
     */
    public function indexStudent(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Return plans assigned to student (or all plans if user is admin)
        if ($user->role === 'admin') {
            $plans = ProjectPlan::withCount('tasks')->get();
        } else {
            $plans = $user->assignedProjectPlans()->withCount('tasks')->get();
        }

        // Attach overall completion % for each plan for this user
        foreach ($plans as $plan) {
            $userProgs = ProjectTaskProgress::where('project_plan_id', $plan->id)
                ->where('user_id', $user->id)
                ->get();

            $totalTasks = $plan->tasks_count ?? $plan->tasks()->count();
            $completedTasks = $userProgs->where('status', 'completed')->count();
            $avgProgress = $totalTasks > 0 ? (int) round($userProgs->sum('progress_percentage') / $totalTasks) : 0;

            $plan->user_overall_progress = $avgProgress;
            $plan->user_completed_tasks = $completedTasks;
        }

        return response()->json(['plans' => $plans]);
    }

    /**
     * Get single project plan for student with their task progress
     */
    public function showPlanStudent(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $plan = ProjectPlan::with(['tasks' => function ($q) {
            $q->orderBy('sort_order');
        }])->findOrFail($id);

        // Fetch student's progress records
        $userProgress = ProjectTaskProgress::where('project_plan_id', $plan->id)
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('project_task_id');

        // Group tasks by phase and annotate each task with user progress
        $groupedPhases = [];
        $totalTasks = $plan->tasks->count();
        $completedTasks = 0;
        $totalProgressSum = 0;

        foreach ($plan->tasks as $task) {
            $prog = $userProgress->get($task->id);
            $pct = $prog ? $prog->progress_percentage : 0;
            $status = $prog ? $prog->status : 'not_started';
            $userComments = $prog ? $prog->user_comments : '';

            if ($status === 'completed' || $pct >= 100) $completedTasks++;
            $totalProgressSum += $pct;

            $taskItem = [
                'id' => $task->id,
                'phase' => $task->phase,
                'prefix' => $task->prefix,
                'title' => $task->title,
                'details' => $task->details,
                'comments' => $task->comments,
                'sort_order' => $task->sort_order,
                'user_progress_percentage' => $pct,
                'user_status' => $status,
                'user_comments' => $userComments,
            ];

            if (!isset($groupedPhases[$task->phase])) {
                $groupedPhases[$task->phase] = [
                    'phase_name' => $task->phase,
                    'tasks' => [],
                    'completed_tasks' => 0,
                    'total_tasks' => 0,
                    'phase_progress_percentage' => 0,
                ];
            }

            $groupedPhases[$task->phase]['tasks'][] = $taskItem;
            $groupedPhases[$task->phase]['total_tasks']++;
            if ($pct >= 100) $groupedPhases[$task->phase]['completed_tasks']++;
        }

        // Calculate phase progress averages
        foreach ($groupedPhases as &$phaseData) {
            $phaseTaskCount = count($phaseData['tasks']);
            $phaseProgressSum = array_sum(array_column($phaseData['tasks'], 'user_progress_percentage'));
            $phaseData['phase_progress_percentage'] = $phaseTaskCount > 0 ? (int) round($phaseProgressSum / $phaseTaskCount) : 0;
        }

        $overallProgress = $totalTasks > 0 ? (int) round($totalProgressSum / $totalTasks) : 0;

        return response()->json([
            'plan' => $plan,
            'phases' => array_values($groupedPhases),
            'overall_progress' => $overallProgress,
            'completed_tasks' => $completedTasks,
            'total_tasks' => $totalTasks,
        ]);
    }

    /**
     * Student updates their progress percentage for a task
     */
    public function updateStudentProgress(Request $request, $planId, $taskId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
            'user_comments' => 'nullable|string',
        ]);

        $task = ProjectTask::where('project_plan_id', $planId)->findOrFail($taskId);

        $pct = (int) $request->progress_percentage;
        $status = $pct >= 100 ? 'completed' : ($pct > 0 ? 'in_progress' : 'not_started');

        $prog = ProjectTaskProgress::updateOrCreate(
            [
                'project_plan_id' => $planId,
                'project_task_id' => $task->id,
                'user_id' => $user->id,
            ],
            [
                'progress_percentage' => $pct,
                'status' => $status,
                'user_comments' => $request->user_comments,
                'completed_at' => $pct >= 100 ? now() : null,
            ]
        );

        return response()->json([
            'message' => 'Task progress saved',
            'progress' => $prog,
        ]);
    }
}
