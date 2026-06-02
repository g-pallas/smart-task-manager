<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArchiveController;
use App\Http\Controllers\Api\CalendarEventController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TrashController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [SettingsController::class, 'updateProfile']);
    Route::put('/me/password', [SettingsController::class, 'updatePassword']);
    Route::put('/me/preferences', [SettingsController::class, 'updatePreferences']);

    Route::get('/archive', [ArchiveController::class, 'index']);
    Route::post('/projects/{project}/archive', [ArchiveController::class, 'archiveProject']);
    Route::post('/projects/{project}/restore-archive', [ArchiveController::class, 'restoreProject']);
    Route::post('/projects/{project}/tasks/{task}/archive', [ArchiveController::class, 'archiveTask']);
    Route::post('/projects/{project}/tasks/{task}/restore-archive', [ArchiveController::class, 'restoreTask']);

    Route::get('/trash', [TrashController::class, 'index']);
    Route::post('/trash/empty', [TrashController::class, 'empty']);
    Route::post('/trash/projects/{project}/restore', [TrashController::class, 'restoreProject']);
    Route::delete('/trash/projects/{project}', [TrashController::class, 'forceDeleteProject']);
    Route::post('/trash/tasks/{task}/restore', [TrashController::class, 'restoreTask']);
    Route::delete('/trash/tasks/{task}', [TrashController::class, 'forceDeleteTask']);

    Route::get('/calendar-events', [CalendarEventController::class, 'index']);
    Route::post('/calendar-events', [CalendarEventController::class, 'store']);
    Route::put('/calendar-events/{calendarEvent}', [CalendarEventController::class, 'update']);
    Route::delete('/calendar-events/{calendarEvent}', [CalendarEventController::class, 'destroy']);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
    Route::put('/projects/{project}/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/projects/{project}/tasks/{task}', [TaskController::class, 'destroy']);
});
