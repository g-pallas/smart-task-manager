<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectTaskAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_all_projects(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();

        $projectA = Project::create([
            'name' => 'Alpha',
            'description' => 'Admin can see this',
            'owner_id' => $ownerA->id,
        ]);

        $projectB = Project::create([
            'name' => 'Beta',
            'description' => 'Admin can see this too',
            'owner_id' => $ownerB->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/projects');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $projectA->id, 'name' => 'Alpha']);
        $response->assertJsonFragment(['id' => $projectB->id, 'name' => 'Beta']);
    }

    public function test_user_sees_owned_and_member_projects_only(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $ownedProject = Project::create([
            'name' => 'Owned Project',
            'description' => 'Owned by current user',
            'owner_id' => $user->id,
        ]);
        $ownedProject->members()->attach($user->id);

        $memberProject = Project::create([
            'name' => 'Member Project',
            'description' => 'User is a member only',
            'owner_id' => $owner->id,
        ]);
        $memberProject->members()->attach($user->id);

        $hiddenProject = Project::create([
            'name' => 'Hidden Project',
            'description' => 'Should not be visible',
            'owner_id' => $stranger->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/projects');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $ownedProject->id, 'name' => 'Owned Project']);
        $response->assertJsonFragment(['id' => $memberProject->id, 'name' => 'Member Project']);
        $response->assertJsonMissing(['id' => $hiddenProject->id, 'name' => 'Hidden Project']);
    }

    public function test_member_cannot_update_project_they_do_not_own(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $project = Project::create([
            'name' => 'Owner Project',
            'description' => 'Only owner can edit',
            'owner_id' => $owner->id,
        ]);
        $project->members()->attach($member->id);

        Sanctum::actingAs($member);

        $response = $this->putJson("/api/projects/{$project->id}", [
            'name' => 'Changed Name',
        ]);

        $response->assertForbidden();
        $this->assertSame('Owner Project', $project->fresh()->name);
    }

    public function test_member_can_view_tasks_but_cannot_create_tasks_in_non_owned_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $project = Project::create([
            'name' => 'Shared Project',
            'description' => 'Member can read only',
            'owner_id' => $owner->id,
        ]);
        $project->members()->attach($member->id);

        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Existing Task',
            'description' => 'Visible to member',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($member);

        $listResponse = $this->getJson("/api/projects/{$project->id}/tasks");
        $listResponse->assertOk();
        $listResponse->assertJsonFragment(['id' => $task->id, 'title' => 'Existing Task']);

        $createResponse = $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Blocked Task',
            'description' => 'Member should not create this',
        ]);

        $createResponse->assertForbidden();
    }

    public function test_admin_can_update_and_delete_any_task(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create();

        $project = Project::create([
            'name' => 'Project',
            'description' => 'Owned by another user',
            'owner_id' => $owner->id,
        ]);

        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Task Before Admin Update',
            'description' => 'Admin can manage this',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($admin);

        $updateResponse = $this->putJson("/api/projects/{$project->id}/tasks/{$task->id}", [
            'title' => 'Admin Updated Title',
            'status' => 'done',
        ]);
        $updateResponse->assertOk();
        $this->assertSame('Admin Updated Title', $task->fresh()->title);
        $this->assertSame('done', $task->fresh()->status);

        $deleteResponse = $this->deleteJson("/api/projects/{$project->id}/tasks/{$task->id}");
        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}