<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->query('search');
        $from = $request->query('from');
        $to = $request->query('to');

        $events = CalendarEvent::query()
            ->where('user_id', $user->id)
            ->when($from, fn ($query) => $query->whereDate('starts_at', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('starts_at', '<=', $to))
            ->when($search, fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->orderBy('starts_at')
            ->get()
            ->map(fn (CalendarEvent $event) => [
                'id' => $event->id,
                'type' => 'event',
                'title' => $event->title,
                'description' => $event->description,
                'starts_at' => $event->starts_at,
                'ends_at' => $event->ends_at,
                'color' => $event->color,
                'project_id' => $event->project_id,
            ]);

        $tasks = Task::query()
            ->with('project:id,name,owner_id')
            ->whereNull('archived_at')
            ->whereNotNull('due_date')
            ->whereHas('project', function ($query) use ($user) {
                if ($user->isAdmin()) {
                    return;
                }

                $query->where('owner_id', $user->id)
                    ->orWhereHas('members', fn ($memberQuery) => $memberQuery->where('users.id', $user->id));
            })
            ->when($from, fn ($query) => $query->whereDate('due_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('due_date', '<=', $to))
            ->when($search, fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->orderBy('due_date')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'description' => $task->description,
                'starts_at' => $task->due_date?->startOfDay(),
                'ends_at' => null,
                'color' => $task->status === 'done' ? 'muted' : ($task->status === 'in_progress' ? 'indigo' : 'danger'),
                'project_id' => $task->project_id,
                'project_name' => $task->project?->name,
                'status' => $task->status,
            ]);

        return response()->json([
            'data' => $events->concat($tasks)->sortBy('starts_at')->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $this->authorizeProjectAccess($request, $data['project_id'] ?? null);

        $event = CalendarEvent::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($event, 201);
    }

    public function update(Request $request, CalendarEvent $calendarEvent): JsonResponse
    {
        abort_unless($calendarEvent->user_id === $request->user()->id || $request->user()->isAdmin(), 403);

        $data = $this->validated($request, true);
        $this->authorizeProjectAccess($request, $data['project_id'] ?? $calendarEvent->project_id);

        $calendarEvent->update($data);

        return response()->json($calendarEvent);
    }

    public function destroy(Request $request, CalendarEvent $calendarEvent): JsonResponse
    {
        abort_unless($calendarEvent->user_id === $request->user()->id || $request->user()->isAdmin(), 403);

        $calendarEvent->delete();

        return response()->json(['message' => 'Event deleted']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'project_id' => ['nullable', 'exists:projects,id'],
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_at' => [$required, 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);
    }

    private function authorizeProjectAccess(Request $request, ?int $projectId): void
    {
        if (! $projectId) {
            return;
        }

        $project = Project::findOrFail($projectId);
        $this->authorize('view', $project);
    }
}
