<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceFunctionalityTest extends TestCase
{
    use RefreshDatabase;

    public function test_archived_projects_are_hidden_and_restorable(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'name' => 'Archive Me',
            'description' => 'Hidden when archived',
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);

        Sanctum::actingAs($user);

        $this->postJson("/api/projects/{$project->id}/archive")->assertOk();
        $this->getJson('/api/projects')->assertJsonMissing(['name' => 'Archive Me']);
        $this->getJson('/api/archive')->assertJsonFragment(['title' => 'Archive Me', 'type' => 'project']);

        $this->postJson("/api/projects/{$project->id}/restore-archive")->assertOk();
        $this->getJson('/api/projects')->assertJsonFragment(['name' => 'Archive Me']);
    }

    public function test_soft_deleted_tasks_can_be_restored_or_permanently_deleted(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'name' => 'Trash Project',
            'description' => null,
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);
        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Trash Task',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/projects/{$project->id}/tasks/{$task->id}")->assertOk();
        $this->getJson('/api/trash')->assertJsonFragment(['title' => 'Trash Task', 'type' => 'task']);

        $this->postJson("/api/trash/tasks/{$task->id}/restore")->assertOk();
        $this->assertFalse($task->fresh()->trashed());

        $this->deleteJson("/api/projects/{$project->id}/tasks/{$task->id}")->assertOk();
        $this->deleteJson("/api/trash/tasks/{$task->id}")->assertOk();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_calendar_events_are_scoped_to_authenticated_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        CalendarEvent::create([
            'user_id' => $other->id,
            'title' => 'Hidden Event',
            'starts_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/calendar-events', [
            'title' => 'Visible Event',
            'description' => 'Planning',
            'starts_at' => '2026-06-02 09:00:00',
        ]);

        $response->assertCreated();
        $this->getJson('/api/calendar-events')
            ->assertJsonFragment(['title' => 'Visible Event'])
            ->assertJsonMissing(['title' => 'Hidden Event']);
    }

    public function test_profile_password_and_preferences_can_be_updated(): void
    {
        $user = User::factory()->create(['password' => Hash::make('password')]);

        Sanctum::actingAs($user);

        $this->putJson('/api/me', [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
        ])->assertOk()->assertJsonFragment(['name' => 'Updated User']);

        $this->putJson('/api/me/preferences', [
            'desktop_notifications' => true,
            'dark_mode' => false,
            'ai_suggestions' => true,
        ])->assertOk()->assertJsonPath('preferences.ai_suggestions', true);

        $this->putJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();
    }
}
