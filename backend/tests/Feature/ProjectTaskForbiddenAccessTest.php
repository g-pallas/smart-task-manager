<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectTaskForbiddenAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_projects_index(): void
    {
        $response = $this->getJson('/api/projects');

        $response->assertUnauthorized();
    }

    public function test_non_member_cannot_view_another_projects_tasks(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $project = Project::create([
            'name' => 'Private Project',
            'description' => 'Only owner or members can view tasks',
            'owner_id' => $owner->id,
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Hidden Task',
            'description' => 'Should not be visible',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($stranger);

        $response = $this->getJson("/api/projects/{$project->id}/tasks");

        $response->assertForbidden();
    }

    public function test_non_owner_cannot_delete_another_owners_task(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $project = Project::create([
            'name' => 'Owner Project',
            'description' => 'Stranger should not delete task',
            'owner_id' => $owner->id,
        ]);

        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Protected Task',
            'description' => 'Should remain in database',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($stranger);

        $response = $this->deleteJson("/api/projects/{$project->id}/tasks/{$task->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    }
}
