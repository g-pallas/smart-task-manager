<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $status = $request->query('status');
        $search = $request->query('search');

        $tasks = Task::query()
            ->where('project_id', $project->id)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('title', 'like', "%{$search}%")
                       ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10);

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['todo', 'in_progress', 'done'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $task = Task::create([
            ...$data,
            'project_id' => $project->id,
            'status' => $data['status'] ?? 'todo',
        ]);

        return response()->json($task, 201);
    }

    public function update(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'done'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
