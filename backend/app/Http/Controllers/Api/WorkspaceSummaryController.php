<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\WorkspaceActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceSummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $weekStart = now()->startOfWeek();
        $previousWeeksStart = $weekStart->copy()->subWeeks(4);

        $projectsQuery = $this->visibleProjects($request)
            ->whereNull('archived_at');
        $projectIds = (clone $projectsQuery)->pluck('id');

        $tasksQuery = Task::query()
            ->whereIn('project_id', $projectIds)
            ->whereNull('archived_at');

        $activeProjects = (clone $projectsQuery)->count();
        $projectsCreatedThisWeek = (clone $projectsQuery)
            ->where('created_at', '>=', $weekStart)
            ->count();
        $completedThisWeek = (clone $tasksQuery)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $weekStart)
            ->count();
        $previousCompleted = (clone $tasksQuery)
            ->where('completed_at', '>=', $previousWeeksStart)
            ->where('completed_at', '<', $weekStart)
            ->count();

        $openTasks = (clone $tasksQuery)->where('status', '!=', 'done');
        $dueToday = (clone $openTasks)->whereDate('due_date', today())->count();
        $overdue = (clone $openTasks)->whereDate('due_date', '<', today())->count();

        $automaticPriorityProject = (clone $projectsQuery)
            ->whereHas('tasks', fn (Builder $query) => $query
                ->whereNull('archived_at')
                ->where('status', '!=', 'done')
                ->whereNotNull('due_date'))
            ->withCount([
                'tasks as overdue_tasks_count' => fn (Builder $query) => $query
                    ->whereNull('archived_at')
                    ->where('status', '!=', 'done')
                    ->whereDate('due_date', '<', today()),
            ])
            ->withMin([
                'tasks as next_due_date' => fn (Builder $query) => $query
                    ->whereNull('archived_at')
                    ->where('status', '!=', 'done')
                    ->whereNotNull('due_date'),
            ], 'due_date')
            ->orderByDesc('overdue_tasks_count')
            ->orderByRaw('next_due_date is null')
            ->orderBy('next_due_date')
            ->first();

        $manualPriorityProject = null;
        if ($user->priority_project_id) {
            $manualPriorityProject = (clone $projectsQuery)
                ->whereKey($user->priority_project_id)
                ->withCount([
                    'tasks as overdue_tasks_count' => fn (Builder $query) => $query
                        ->whereNull('archived_at')
                        ->where('status', '!=', 'done')
                        ->whereDate('due_date', '<', today()),
                ])
                ->withMin([
                    'tasks as next_due_date' => fn (Builder $query) => $query
                        ->whereNull('archived_at')
                        ->where('status', '!=', 'done')
                        ->whereNotNull('due_date'),
                ], 'due_date')
                ->first();
        }

        $priorityProject = $manualPriorityProject ?? $automaticPriorityProject;
        $prioritySource = $manualPriorityProject ? 'manual' : 'automatic';

        $statusCounts = (clone $tasksQuery)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $activities = WorkspaceActivity::query()
            ->with('user:id,name')
            ->when(! $user->isAdmin(), function (Builder $query) use ($projectIds, $user) {
                $query->where(function (Builder $scope) use ($projectIds, $user) {
                    $scope->whereIn('project_id', $projectIds)
                        ->orWhere('user_id', $user->id);
                });
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (WorkspaceActivity $activity) => [
                'id' => $activity->id,
                'action' => $activity->action,
                'subject_type' => $activity->subject_type,
                'subject_name' => $activity->subject_name,
                'actor_name' => $activity->user?->name,
                'metadata' => $activity->metadata,
                'created_at' => $activity->created_at,
            ]);

        $notificationTasks = (clone $openTasks)
            ->with('project:id,name')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', today())
            ->orderBy('due_date')
            ->limit(20)
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'due_date' => $task->due_date?->toDateString(),
                'project_id' => $task->project_id,
                'project_name' => $task->project?->name,
                'is_overdue' => $task->due_date?->isBefore(today()) ?? false,
            ]);

        return response()->json([
            'metrics' => [
                'active_projects' => $activeProjects,
                'projects_created_this_week' => $projectsCreatedThisWeek,
                'tasks_completed_this_week' => $completedThisWeek,
                'previous_four_week_average' => round($previousCompleted / 4, 1),
                'due_today' => $dueToday,
                'overdue' => $overdue,
            ],
            'priority_project' => $priorityProject ? [
                'id' => $priorityProject->id,
                'name' => $priorityProject->name,
                'overdue_tasks_count' => $priorityProject->overdue_tasks_count,
                'next_due_date' => $priorityProject->next_due_date,
                'source' => $prioritySource,
            ] : null,
            'health' => [
                'todo' => (int) ($statusCounts['todo'] ?? 0),
                'in_progress' => (int) ($statusCounts['in_progress'] ?? 0),
                'done' => (int) ($statusCounts['done'] ?? 0),
                'overdue' => $overdue,
            ],
            'activities' => $activities,
            'notification_tasks' => $notificationTasks,
        ]);
    }

    private function visibleProjects(Request $request): Builder
    {
        $user = $request->user();

        return Project::query()->when(! $user->isAdmin(), function (Builder $query) use ($user) {
            $query->where(function (Builder $scope) use ($user) {
                $scope->where('owner_id', $user->id)
                    ->orWhereHas('members', fn (Builder $members) => $members->where('users.id', $user->id));
            });
        });
    }
}
