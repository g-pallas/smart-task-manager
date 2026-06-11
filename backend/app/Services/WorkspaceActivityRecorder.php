<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkspaceActivity;

class WorkspaceActivityRecorder
{
    public static function project(User $user, Project $project, string $action, array $metadata = []): void
    {
        WorkspaceActivity::create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'action' => $action,
            'subject_type' => 'project',
            'subject_name' => $project->name,
            'metadata' => $metadata ?: null,
        ]);
    }

    public static function task(User $user, Task $task, string $action, array $metadata = []): void
    {
        WorkspaceActivity::create([
            'user_id' => $user->id,
            'project_id' => $task->project_id,
            'task_id' => $task->id,
            'action' => $action,
            'subject_type' => 'task',
            'subject_name' => $task->title,
            'metadata' => $metadata ?: null,
        ]);
    }
}
