<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
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
        ])->assertOk()
            ->assertJsonPath('preferences.desktop_notifications', true)
            ->assertJsonMissingPath('preferences.dark_mode')
            ->assertJsonMissingPath('preferences.ai_suggestions');

        $this->putJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();
    }

    public function test_workspace_summary_is_scoped_and_uses_real_task_data(): void
    {
        Carbon::setTestNow('2026-06-11 10:00:00');

        $user = User::factory()->create();
        $other = User::factory()->create();
        $priority = Project::create([
            'name' => 'Priority Project',
            'owner_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $priority->members()->attach($user->id);
        $secondary = Project::create([
            'name' => 'Secondary Project',
            'owner_id' => $user->id,
        ]);
        $secondary->forceFill([
            'created_at' => now()->subWeeks(2),
            'updated_at' => now()->subWeeks(2),
        ])->saveQuietly();
        $secondary->members()->attach($user->id);
        $hidden = Project::create([
            'name' => 'Hidden Project',
            'owner_id' => $other->id,
        ]);

        Task::create([
            'project_id' => $priority->id,
            'title' => 'Overdue task',
            'due_date' => '2026-06-10',
            'status' => 'todo',
        ]);
        Task::create([
            'project_id' => $priority->id,
            'title' => 'Due today',
            'due_date' => '2026-06-11',
            'status' => 'in_progress',
        ]);
        Task::create([
            'project_id' => $secondary->id,
            'title' => 'Completed this week',
            'status' => 'done',
            'completed_at' => now()->subDay(),
        ]);
        Task::create([
            'project_id' => $secondary->id,
            'title' => 'Previous completion',
            'status' => 'done',
            'completed_at' => now()->subWeeks(2),
        ]);
        Task::create([
            'project_id' => $hidden->id,
            'title' => 'Hidden overdue task',
            'due_date' => '2026-06-01',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/workspace-summary')
            ->assertOk()
            ->assertJsonPath('metrics.active_projects', 2)
            ->assertJsonPath('metrics.projects_created_this_week', 1)
            ->assertJsonPath('metrics.tasks_completed_this_week', 1)
            ->assertJsonPath('metrics.previous_four_week_average', 0.3)
            ->assertJsonPath('metrics.due_today', 1)
            ->assertJsonPath('metrics.overdue', 1)
            ->assertJsonPath('priority_project.id', $priority->id)
            ->assertJsonPath('priority_project.source', 'automatic')
            ->assertJsonPath('health.done', 2)
            ->assertJsonCount(2, 'notification_tasks')
            ->assertJsonPath('notification_tasks.0.project_id', $priority->id)
            ->assertJsonMissing(['title' => 'Hidden overdue task']);

        Carbon::setTestNow();
    }

    public function test_personal_priority_overrides_automatic_priority_and_is_user_scoped(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $manual = Project::create([
            'name' => 'Manual Priority',
            'owner_id' => $user->id,
        ]);
        $manual->members()->attach($user->id);
        $automatic = Project::create([
            'name' => 'Automatic Priority',
            'owner_id' => $user->id,
        ]);
        $automatic->members()->attach($user->id);
        $hidden = Project::create([
            'name' => 'Hidden Priority',
            'owner_id' => $other->id,
        ]);

        Task::create([
            'project_id' => $automatic->id,
            'title' => 'Overdue',
            'due_date' => now()->subDay(),
            'status' => 'todo',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/me/priority-project', [
            'project_id' => $hidden->id,
        ])->assertForbidden();

        $this->putJson('/api/me/priority-project', [
            'project_id' => $manual->id,
        ])->assertOk()
            ->assertJsonPath('priority_project.id', $manual->id);

        $this->getJson('/api/workspace-summary')
            ->assertOk()
            ->assertJsonPath('priority_project.id', $manual->id)
            ->assertJsonPath('priority_project.source', 'manual');

        $this->putJson('/api/me/priority-project', [
            'project_id' => null,
        ])->assertOk()
            ->assertJsonPath('priority_project', null);

        $this->getJson('/api/workspace-summary')
            ->assertJsonPath('priority_project.id', $automatic->id)
            ->assertJsonPath('priority_project.source', 'automatic');
    }

    public function test_archive_and_trash_support_type_filters_and_archive_to_trash(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'name' => 'Archived Project',
            'owner_id' => $user->id,
            'archived_at' => now(),
        ]);
        $project->members()->attach($user->id);
        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Archived Task',
            'status' => 'todo',
            'archived_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/archive?type=task')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Archived Task', 'type' => 'task'])
            ->assertJsonMissing(['title' => 'Archived Project', 'type' => 'project']);

        $this->postJson("/api/archive/tasks/{$task->id}/trash")->assertOk();
        $this->assertSoftDeleted('tasks', ['id' => $task->id]);

        $this->getJson('/api/trash?type=task')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Archived Task', 'type' => 'task'])
            ->assertJsonMissingPath('data.0.expires_at');
    }

    public function test_task_completion_timestamp_and_activity_follow_status_transitions(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'name' => 'Tracked Project',
            'owner_id' => $user->id,
        ]);
        $project->members()->attach($user->id);
        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Tracked Task',
            'status' => 'todo',
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/projects/{$project->id}/tasks/{$task->id}", [
            'status' => 'done',
        ])->assertOk();

        $this->assertNotNull($task->fresh()->completed_at);
        $this->assertDatabaseHas('workspace_activities', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'action' => 'task_completed',
        ]);

        $this->putJson("/api/projects/{$project->id}/tasks/{$task->id}", [
            'status' => 'todo',
        ])->assertOk();

        $this->assertNull($task->fresh()->completed_at);
        $this->assertDatabaseHas('workspace_activities', [
            'task_id' => $task->id,
            'action' => 'task_reopened',
        ]);
    }
}
