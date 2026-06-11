<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Services\WorkspaceActivityRecorder;
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
            ->whereNull('archived_at')
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
            'completed_at' => ($data['status'] ?? 'todo') === 'done' ? now() : null,
        ]);
        WorkspaceActivityRecorder::task($request->user(), $task, 'task_created');

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

        $previousStatus = $task->status;
        $nextStatus = $data['status'] ?? $previousStatus;

        if ($nextStatus === 'done' && $previousStatus !== 'done') {
            $data['completed_at'] = now();
        } elseif ($nextStatus !== 'done' && $previousStatus === 'done') {
            $data['completed_at'] = null;
        }

        $task->update($data);

        $action = match (true) {
            $previousStatus !== 'done' && $nextStatus === 'done' => 'task_completed',
            $previousStatus === 'done' && $nextStatus !== 'done' => 'task_reopened',
            $previousStatus !== $nextStatus => 'task_status_changed',
            default => 'task_updated',
        };
        WorkspaceActivityRecorder::task($request->user(), $task, $action, [
            'previous_status' => $previousStatus,
            'status' => $nextStatus,
        ]);

        return response()->json($task);
    }

    public function destroy(Request $request, Project $project, Task $task): JsonResponse
    {
        abort_unless($task->project_id === $project->id, 404);
        $this->authorize('delete', $task);

        WorkspaceActivityRecorder::task($request->user(), $task, 'task_deleted');
        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
