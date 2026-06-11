<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\WorkspaceActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request):JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        $user = $request->user();
        $search = $request->query('search');

        $projects = Project::query()
            ->when(! $user->isAdmin(), function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('owner_id', $user->id)
                        ->orWhereHas('members', function ($memberQuery) use ($user) {
                            $memberQuery->where('users.id', $user->id);
                        });
                });
            })
            ->whereNull('archived_at')
            ->when($search, function ($query, $search){
                $query->where(function ($q) use ($search){
                     $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->withCount([
                'tasks' => fn ($query) => $query->whereNull('archived_at'),
                'tasks as completed_tasks_count' => fn ($query) => $query
                    ->whereNull('archived_at')
                    ->where('status', 'done'),
            ])
            ->withMin(['tasks' => fn ($query) => $query->whereNull('archived_at')], 'due_date')
            ->latest()
            ->paginate(10);

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $project = Project::create([
            ...$data,
            'owner_id' => $request->user()->id,
        ]);

        $project->members()->attach($request->user()->id);
        WorkspaceActivityRecorder::project($request->user(), $project, 'project_created');

        return response()->json($project, 201);
    }

    public function show (Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json($project->load('members:id,name,email'));
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $project->update($data);
        WorkspaceActivityRecorder::project($request->user(), $project, 'project_updated');

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        WorkspaceActivityRecorder::project($request->user(), $project, 'project_deleted');
        $project->tasks()->delete();
        $project->delete();

        return response()->json(['message' => 'Project deleted']);
    }
}
