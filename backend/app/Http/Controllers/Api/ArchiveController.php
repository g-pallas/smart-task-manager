<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->query('search');

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

        return response()->json([
            'data' => $projects->concat($tasks)->sortByDesc('archived_at')->values(),
        ]);
    }

    public function archiveProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->update(['archived_at' => now()]);
        $project->tasks()->update(['archived_at' => now()]);

        return response()->json(['message' => 'Project archived']);
    }

    public function restoreProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->update(['archived_at' => null]);
        $project->tasks()->update(['archived_at' => null]);

        return response()->json(['message' => 'Project restored']);
    }

    public function archiveTask(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        $task->update(['archived_at' => now()]);

        return response()->json(['message' => 'Task archived']);
    }

    public function restoreTask(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        $task->update(['archived_at' => null]);

        return response()->json(['message' => 'Task restored']);
    }

    private function scopeProjectsToUser($query, $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($memberQuery) => $memberQuery->where('users.id', $user->id));
        });
    }
}
