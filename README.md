# Smart Task Manager

Smart Task Manager is a full-stack productivity web app built with a Laravel API and a React/Vite frontend. It supports authenticated project and task management, real workspace analytics, task-derived calendars, personal project priorities, desktop alerts, archive and trash workflows, profile settings, and a responsive TaskCurator interface.

## Live Deployment

- Frontend: `https://smart-task-manager-azure.vercel.app`
- Backend API: `https://smart-task-manager-production-c6c4.up.railway.app/api`
- Backend health check: `https://smart-task-manager-production-c6c4.up.railway.app/up`

## Features

- User registration, login, logout, and token-based authentication with Laravel Sanctum
- Password visibility toggle on login and sign-up forms
- Dashboard metrics derived from real workspace data
- Weekly project growth, task-completion velocity, due-today, and overdue statistics
- Project CRUD with progress derived from task completion
- Task CRUD with status updates, completion timestamps, due dates, pagination, and project scoping
- Day, week, and month calendar views generated automatically from task due dates
- Personal priority projects with automatic overdue/nearest-due fallback
- Workspace activity timeline and factual project-health totals
- Desktop notifications for due-today and overdue tasks with daily deduplication
- Archive workflow with filtering, restoration, and move-to-trash actions
- Trash workflow with filtering, restoration, permanent deletion, and empty trash
- Settings page for profile, password, and desktop notification preferences
- Automatic light and dark themes based on the device color scheme
- Search across dashboard, projects, calendar, FAQ, archive, and trash views
- Shared FAQ/help center with searchable accordion sections
- Toast notifications and Laravel validation error display
- Authorization policies for project/task access
- Frontend integration tests and backend feature tests

## Tech Stack

### Backend

- Laravel
- Laravel Sanctum
- Eloquent ORM
- Soft deletes
- Feature tests with PHPUnit
- Railway deployment

### Frontend

- React
- Vite
- Axios
- CSS/Tailwind utility classes
- Vitest + Testing Library
- Vercel deployment

## Project Structure

```txt
smart-task-manager/
  backend/   # Laravel API
  frontend/  # React/Vite app
```

## Core Backend Models

- `User`
- `Project`
- `Task`
- `CalendarEvent`
- `WorkspaceActivity`

## Important Data Behavior

- Deleting a project or task soft-deletes it first, moving it to Trash.
- Archive is separate from Trash and uses `archived_at`.
- Active project/task lists exclude archived and trashed records.
- The application calendar displays tasks with due dates only.
- Legacy calendar-event API records remain available for compatibility but are not displayed or created by the current UI.
- Completing a task records `completed_at`; moving it out of Done clears that timestamp.
- Workspace activity is recorded for project and task mutations.
- Each user may select one personal priority project. If it becomes unavailable, priority falls back to overdue tasks and then the nearest due date.
- User preferences are stored on the `users.preferences` JSON column. Only `desktop_notifications` is currently supported.
- Device light/dark preference is authoritative; no manual theme override is stored.

## Main API Endpoints

### Auth

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Settings

- `PUT /api/me`
- `PUT /api/me/password`
- `PUT /api/me/preferences`
- `PUT /api/me/priority-project`

### Workspace

- `GET /api/workspace-summary`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project}`
- `PUT /api/projects/{project}`
- `DELETE /api/projects/{project}`
- `POST /api/projects/{project}/archive`
- `POST /api/projects/{project}/restore-archive`
- `POST /api/archive/projects/{project}/trash`

### Tasks

- `GET /api/projects/{project}/tasks`
- `POST /api/projects/{project}/tasks`
- `PUT /api/projects/{project}/tasks/{task}`
- `DELETE /api/projects/{project}/tasks/{task}`
- `POST /api/projects/{project}/tasks/{task}/archive`
- `POST /api/projects/{project}/tasks/{task}/restore-archive`
- `POST /api/archive/tasks/{task}/trash`

### Legacy Calendar Event Compatibility

- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `PUT /api/calendar-events/{calendarEvent}`
- `DELETE /api/calendar-events/{calendarEvent}`

The current frontend calendar does not call these endpoints. It renders project tasks with due dates.

### Archive And Trash

- `GET /api/archive`
- `GET /api/trash`
- `POST /api/trash/projects/{project}/restore`
- `POST /api/trash/tasks/{task}/restore`
- `DELETE /api/trash/projects/{project}`
- `DELETE /api/trash/tasks/{task}`
- `POST /api/trash/empty`

## Frontend Components

- `App.jsx`: app orchestration, API calls, workspace summary, notifications, view state, and auth/session state
- `LoginForm.jsx`: sign-in screen
- `RegisterForm.jsx`: sign-up screen
- `PasswordField.jsx`: reusable password field with eye toggle
- `ProjectsPanel.jsx`: dashboard project list
- `TasksPanel.jsx`: dashboard task list
- `ProjectsPage.jsx`: active projects, personal priority controls, health totals, and activity timeline
- `CalendarPage.jsx`: task-derived day, week, and month calendar views
- `SettingsPage.jsx`: profile, password, and desktop notification controls
- `ArchivePage.jsx`: filtered archived-item restore and move-to-trash workflows
- `TrashPage.jsx`: filtered restore, permanent-delete, and empty-trash workflows
- `FaqPage.jsx`: searchable FAQ/help center
- `FaqButton.jsx`: shared FAQ navigation control
- `NotificationBell.jsx`: in-app due-task alert list
- `lib/desktopNotifications.js`: browser permission, alert delivery, and daily deduplication
- `lib/api.js`: Axios instance, Bearer token attachment, global `401` handler

## Local Setup

### Backend

```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:5173`.

If your backend is not running on the default local URL, set:

```txt
VITE_API_URL=http://127.0.0.1:8000/api
```

## Verification Commands

### Backend

```powershell
cd backend
php artisan test
```

Targeted backend tests:

```powershell
php artisan test --filter=AuthApiTest
php artisan test --filter=ProjectTaskAuthorizationTest
php artisan test --filter=ProjectTaskValidationTest
php artisan test --filter=ProjectTaskForbiddenAccessTest
php artisan test --filter=WorkspaceFunctionalityTest
```

### Frontend

```powershell
cd frontend
npm test
npm run lint
npm run build
```

## Current Test Coverage

### Backend

- Auth registration, login, current user, and logout
- Project/task authorization rules
- Project/task validation rules
- Forbidden access cases
- Archive and restore behavior
- Archive filtering and archive-to-trash behavior
- Soft delete, filtered trash restore, force delete, and empty-trash behavior
- Calendar event scoping
- Profile, password, and preference updates
- Workspace summary calculations and user scoping
- Manual priority selection and automatic priority fallback
- Task completion timestamps and workspace activity records

### Frontend

- Sign-in form rendering
- Login flow
- Unauthorized/session-expired flow
- Logout flow
- Settings preference updates
- Day, week, and month task calendar rendering
- Global New Project navigation and project-form focus
- Manual priority controls and priority-project navigation
- Archive filtering, restoration, and move-to-trash actions
- Trash filtering, restoration, permanent deletion, and empty-trash actions
- Desktop notification permission, disabled/denied states, and daily deduplication
- FAQ navigation, search, and accordion interactions

## Deployment Notes

### Backend

Required production env vars:

```txt
APP_NAME=Smart Task Manager
APP_ENV=production
APP_DEBUG=false
APP_KEY=<generated-laravel-app-key>
APP_URL=<your-backend-url>
FRONTEND_URL=<your-frontend-url>
LOG_CHANNEL=stack
LOG_LEVEL=info
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
MAIL_MAILER=log
```

Database:

```txt
DB_CONNECTION=pgsql
DB_HOST=<host>
DB_PORT=<port>
DB_DATABASE=<database>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

After deploy:

```powershell
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend

Set this in Vercel:

```txt
VITE_API_URL=<your-backend-url>/api
```

Build command:

```powershell
npm run build
```

## Troubleshooting

### Protected routes return `Unauthenticated.`

- Log in again.
- Confirm the frontend sends `Authorization: Bearer <token>`.
- Confirm `VITE_API_URL` points to the correct backend `/api` URL.

### Workspace summary, priority, activity, archive, or notification features fail locally

Run migrations:

```powershell
cd backend
php artisan migrate
```

### Frontend cannot reach backend

- Check `frontend/src/lib/api.js`.
- Check `VITE_API_URL`.
- Confirm the Laravel server is running.
- Confirm CORS allows your frontend URL through `FRONTEND_URL`.

### Route changes do not appear

```powershell
cd backend
php artisan optimize:clear
php artisan route:clear
php artisan route:list
```

## Current Scope

- Desktop alerts are delivered while the application is open or when it regains focus; background push notifications are not included.
- Workspace activity begins when the activity migration and feature are deployed; historical records are not fabricated.
- Calendar events are task-derived in the UI. Standalone event endpoints are retained only for backward compatibility.
