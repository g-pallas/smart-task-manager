<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Services\WorkspaceActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->query('search');
        $type = $request->query('type', 'all');

        $projects = collect();
        if (in_array($type, ['all', 'project'], true)) {
            $projects = Project::onlyTrashed()
            ->when(! $user->isAdmin(), fn ($query) => $this->scopeProjectsToUser($query, $user))
            ->when($search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->latest('deleted_at')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'type' => 'project',
                'title' => $project->name,
                'deleted_at' => $project->deleted_at,
            ]);
        }

        $tasks = collect();
        if (in_array($type, ['all', 'task'], true)) {
            $tasks = Task::onlyTrashed()
            ->with(['project' => fn ($query) => $query->withTrashed()])
            ->when(! $user->isAdmin(), fn ($query) => $query->whereHas('project', fn ($projectQuery) => $this->scopeProjectsToUser($projectQuery, $user)))
            ->when($search, fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->latest('deleted_at')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'deleted_at' => $task->deleted_at,
                'project_id' => $task->project_id,
                'project_name' => $task->project?->name,
            ]);
        }

        return response()->json([
            'data' => $projects->concat($tasks)->sortByDesc('deleted_at')->values(),
        ]);
    }

    public function restoreProject(Request $request, int $project): JsonResponse
    {
        $project = Project::onlyTrashed()->findOrFail($project);
        $this->authorize('delete', $project);

        $project->restore();
        Task::onlyTrashed()->where('project_id', $project->id)->restore();
        WorkspaceActivityRecorder::project($request->user(), $project, 'project_restored_from_trash');

        return response()->json(['message' => 'Project restored']);
    }

    public function forceDeleteProject(Request $request, int $project): JsonResponse
    {
        $project = Project::onlyTrashed()->findOrFail($project);
        $this->authorize('delete', $project);

        WorkspaceActivityRecorder::project($request->user(), $project, 'project_permanently_deleted');
        Task::withTrashed()->where('project_id', $project->id)->forceDelete();
        $project->forceDelete();

        return response()->json(['message' => 'Project permanently deleted']);
    }

    public function restoreTask(Request $request, int $task): JsonResponse
    {
        $task = Task::onlyTrashed()->with(['project' => fn ($query) => $query->withTrashed()])->findOrFail($task);
        $this->authorize('delete', $task);

        if ($task->project?->trashed()) {
            $task->project->restore();
        }
        $task->restore();
        WorkspaceActivityRecorder::task($request->user(), $task, 'task_restored_from_trash');

        return response()->json(['message' => 'Task restored']);
    }

    public function forceDeleteTask(Request $request, int $task): JsonResponse
    {
        $task = Task::onlyTrashed()->with(['project' => fn ($query) => $query->withTrashed()])->findOrFail($task);
        $this->authorize('delete', $task);

        WorkspaceActivityRecorder::task($request->user(), $task, 'task_permanently_deleted');
        $task->forceDelete();

        return response()->json(['message' => 'Task permanently deleted']);
    }

    public function empty(Request $request): JsonResponse
    {
        $items = $this->index($request)->getData(true)['data'] ?? [];
        $projectIds = collect($items)
            ->where('type', 'project')
            ->pluck('id')
            ->all();

        foreach ($items as $item) {
            if ($item['type'] === 'project') {
                $this->forceDeleteProject($request, $item['id']);
            } elseif (! in_array($item['project_id'] ?? null, $projectIds, true)) {
                $this->forceDeleteTask($request, $item['id']);
            }
        }

        return response()->json(['message' => 'Trash emptied']);
    }

    private function scopeProjectsToUser($query, $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($memberQuery) => $memberQuery->where('users.id', $user->id));
        });
    }
}
