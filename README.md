# Smart Task Manager

Smart Task Manager is a full-stack productivity web app built with a Laravel API and a React/Vite frontend. It supports authenticated project and task management, calendar scheduling, archive and trash workflows, profile settings, and a polished TaskCurator interface.

## Live Deployment

- Frontend: `https://smart-task-manager-azure.vercel.app`
- Backend API: `https://smart-task-manager-production-c6c4.up.railway.app/api`
- Backend health check: `https://smart-task-manager-production-c6c4.up.railway.app/up`

## Features

- User registration, login, logout, and token-based authentication with Laravel Sanctum
- Password visibility toggle on login and sign-up forms
- Dashboard metrics derived from real projects and tasks
- Project CRUD with progress derived from task completion
- Task CRUD with status updates, due dates, pagination, and project scoping
- Calendar view combining task due dates and standalone calendar events
- Working New Event form
- Archive workflow for projects and tasks
- Trash workflow with soft delete, restore, permanent delete, and empty trash
- Settings page for profile updates, password updates, and persisted app preferences
- Page-local search across dashboard, projects, calendar, archive, and trash
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

## Important Data Behavior

- Deleting a project or task soft-deletes it first, moving it to Trash.
- Archive is separate from Trash and uses `archived_at`.
- Active project/task lists exclude archived and trashed records.
- Calendar includes both standalone events and task due dates.
- User preferences are stored on the `users.preferences` JSON column.

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

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project}`
- `PUT /api/projects/{project}`
- `DELETE /api/projects/{project}`
- `POST /api/projects/{project}/archive`
- `POST /api/projects/{project}/restore-archive`

### Tasks

- `GET /api/projects/{project}/tasks`
- `POST /api/projects/{project}/tasks`
- `PUT /api/projects/{project}/tasks/{task}`
- `DELETE /api/projects/{project}/tasks/{task}`
- `POST /api/projects/{project}/tasks/{task}/archive`
- `POST /api/projects/{project}/tasks/{task}/restore-archive`

### Calendar

- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `PUT /api/calendar-events/{calendarEvent}`
- `DELETE /api/calendar-events/{calendarEvent}`

### Archive And Trash

- `GET /api/archive`
- `GET /api/trash`
- `POST /api/trash/projects/{project}/restore`
- `POST /api/trash/tasks/{task}/restore`
- `DELETE /api/trash/projects/{project}`
- `DELETE /api/trash/tasks/{task}`
- `POST /api/trash/empty`

## Frontend Components

- `App.jsx`: app orchestration, API calls, view state, auth/session state
- `LoginForm.jsx`: sign-in screen
- `RegisterForm.jsx`: sign-up screen
- `PasswordField.jsx`: reusable password field with eye toggle
- `ProjectsPanel.jsx`: dashboard project list
- `TasksPanel.jsx`: dashboard task list
- `ProjectsPage.jsx`: full projects page
- `CalendarPage.jsx`: calendar month view and event creation
- `SettingsPage.jsx`: profile, password, and preference controls
- `ArchivePage.jsx`: archived project/task restore flow
- `TrashPage.jsx`: soft-deleted item restore/permanent-delete flow
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
- Soft delete, trash restore, and force delete behavior
- Calendar event scoping
- Profile, password, and preference updates

### Frontend

- Sign-in form rendering
- Login flow
- Unauthorized/session-expired flow
- Logout flow
- Settings preference updates
- Calendar event creation
- Archive restore flow
- Empty trash flow

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

### New archive, trash, calendar, or settings features fail locally

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

## Suggested Next Steps

- Add password reset emails.
- Add project member invitation UI.
- Add task assignment filters.
- Add calendar event editing from the calendar cell.
- Add audit/activity history backed by real records.
