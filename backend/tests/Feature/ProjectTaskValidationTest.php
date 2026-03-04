<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectTaskValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_creation_requires_name(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/projects', [
            'description' => 'Missing project name',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('projects', 0);
    }

    public function test_project_update_rejects_empty_name(): void
    {
        $user = User::factory()->create();

        $project = Project::create([
            'name' => 'Original Name',
            'description' => 'Original description',
            'owner_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/projects/{$project->id}", [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        $this->assertSame('Original Name', $project->fresh()->name);
    }

    public function test_task_creation_requires_title(): void
    {
        $user = User::factory()->create();

        $project = Project::create([
            'name' => 'Project',
            'description' => 'Task validation test',
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/tasks", [
            'description' => 'Missing title',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_task_update_rejects_invalid_status(): void
    {
        $user = User::factory()->create();

        $project = Project::create([
            'name' => 'Project',
            'description' => 'Task validation test',
            'owner_id' => $user->id,
        ]);

        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Task',
            'description' => 'Before invalid update',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/projects/{$project->id}/tasks/{$task->id}", [
            'status' => 'blocked',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertSame('todo', $task->fresh()->status);
    }
    public function test_task_creation_rejects_invalid_due_date(): void
    {
        $user = User::factory()->create();

        $project = Project::create([
            'name' => 'Project',
            'description' => 'Due date validation test',
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Task with bad due date',
            'due_date' => 'not-a-date',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['due_date']);

        $this->assertDatabaseMissing('tasks', [
            'title' => 'Task with bad due date',
        ]);
    }

    public function test_task_creation_rejects_invalid_assigned_to(): void
    {
        $user = User::factory()->create();

        $project = Project::create([
            'name' => 'Project',
            'description' => 'Assigned user validation test',
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Task with bad assignee',
            'assigned_to' => 999999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_to']);

        $this->assertDatabaseMissing('tasks', [
            'title' => 'Task with bad assignee',
        ]);
    }
}
