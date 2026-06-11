<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Services\WorkspaceActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->query('search');
        $type = $request->query('type', 'all');

        $projects = collect();
        if (in_array($type, ['all', 'project'], true)) {
            $projects = Project::query()
            ->whereNotNull('archived_at')
            ->when(! $user->isAdmin(), fn ($query) => $this->scopeProjectsToUser($query, $user))
            ->when($search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->latest('archived_at')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'type' => 'project',
                'title' => $project->name,
                'description' => $project->description,
                'archived_at' => $project->archived_at,
                'size_label' => $project->tasks()->withTrashed()->count() . ' tasks',
                'category' => 'Project',
            ]);
        }

        $tasks = collect();
        if (in_array($type, ['all', 'task'], true)) {
            $tasks = Task::query()
            ->with('project:id,name,owner_id')
            ->whereNotNull('archived_at')
            ->when(! $user->isAdmin(), fn ($query) => $query->whereHas('project', fn ($projectQuery) => $this->scopeProjectsToUser($projectQuery, $user)))
            ->when($search, fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->latest('archived_at')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'description' => $task->description,
                'archived_at' => $task->archived_at,
                'size_label' => $task->status,
                'category' => $task->project?->name ?? 'Task',
                'project_id' => $task->project_id,
            ]);
        }

        return response()->json([
            'data' => $projects->concat($tasks)->sortByDesc('archived_at')->values(),
        ]);
    }

    public function archiveProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->update(['archived_at' => now()]);
        $project->tasks()->update(['archived_at' => now()]);
        WorkspaceActivityRecorder::project($request->user(), $project, 'project_archived');

        return response()->json(['message' => 'Project archived']);
    }

    public function restoreProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->update(['archived_at' => null]);
        $project->tasks()->update(['archived_at' => null]);
        WorkspaceActivityRecorder::project($request->user(), $project, 'project_restored');

        return response()->json(['message' => 'Project restored']);
    }

    public function archiveTask(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        $task->update(['archived_at' => now()]);
        WorkspaceActivityRecorder::task($request->user(), $task, 'task_archived');

        return response()->json(['message' => 'Task archived']);
    }

    public function restoreTask(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        $task->update(['archived_at' => null]);
        WorkspaceActivityRecorder::task($request->user(), $task, 'task_restored');

        return response()->json(['message' => 'Task restored']);
    }

    public function trashProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        abort_if($project->archived_at === null, 409, 'Only archived projects can be moved to trash.');

        WorkspaceActivityRecorder::project($request->user(), $project, 'project_deleted');
        $project->tasks()->delete();
        $project->delete();

        return response()->json(['message' => 'Project moved to trash']);
    }

    public function trashTask(Request $request, Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        abort_if($task->archived_at === null, 409, 'Only archived tasks can be moved to trash.');

        WorkspaceActivityRecorder::task($request->user(), $task, 'task_deleted');
        $task->delete();

        return response()->json(['message' => 'Task moved to trash']);
    }

    private function scopeProjectsToUser($query, $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($memberQuery) => $memberQuery->where('users.id', $user->id));
        });
    }
}
