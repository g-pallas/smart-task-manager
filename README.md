# Smart Task Manager

Full-stack web app for managing projects and tasks, built with Laravel (API) + React (Vite) + Tailwind CSS.

## Live Deployment

- Frontend: `https://smart-task-manager-azure.vercel.app`
- Backend API: `https://smart-task-manager-production-c6c4.up.railway.app/api`
- Backend health check: `https://smart-task-manager-production-c6c4.up.railway.app/up`

## What This App Does

This app lets a logged-in user:
- Create and manage projects
- Create and manage tasks inside a selected project
- Track task status (`To do`, `In Progress`, `Done`)
- Filter and search tasks
- Use pagination for task lists
- Stay authenticated with Sanctum token auth

## Why This Project Matters

This project is your practical full-stack training app. It teaches you to:
- Design database relationships
- Build secure Laravel API endpoints
- Protect routes with token auth
- Build React UI that consumes API data
- Handle loading, errors, filtering, and pagination

## Tech Stack

### Backend
- Laravel (API-only style)
- Laravel Sanctum (token authentication)
- Eloquent ORM
- PostgreSQL on Railway

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Vercel deployment

## Project Structure

```txt
smart-task-manager/
  backend/   # Laravel API
  frontend/  # React app
```

## Backend Architecture (Laravel)

### Core Models
- `User`
- `Project`
- `Task`

### Key Relationships
- A `User` owns many `Project`
- A `Project` has many `Task`
- A `Project` has many members through `project_user` pivot
- A `Task` belongs to one `Project`

### Main API Endpoints

Auth:
- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

Projects:
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project}`
- `PUT /api/projects/{project}`
- `DELETE /api/projects/{project}`

Tasks:
- `GET /api/projects/{project}/tasks`
- `POST /api/projects/{project}/tasks`
- `PUT /api/projects/{project}/tasks/{task}`
- `DELETE /api/projects/{project}/tasks/{task}`

## Frontend Architecture (React)

### Main Components
- `App.jsx`
  - App state and orchestration
  - API calls and handlers
  - Auth/session state
- `components/LoginForm.jsx`
  - Login form
- `components/RegisterForm.jsx`
  - Public account creation form
- `components/ProjectsPanel.jsx`
  - Create, select, edit, delete projects
- `components/TasksPanel.jsx`
  - Create/update/delete tasks
  - Filter/search
  - Pagination UI

### API Layer
- `lib/api.js`
  - Axios instance
  - Attaches Bearer token from `localStorage`
  - Handles `401` responses globally (auto-logout flow)

## Features Implemented

- Authentication with Sanctum token
- Login/logout session handling
- Public user registration with auto-login
- Project CRUD
- Inline project edit
- Task CRUD
- Inline task edit (title, description, due date)
- Task status update with human-friendly status labels
- Task filtering by status
- Task search by text
- Task pagination (Prev/Next + page summary)
- Loading and error states in UI panels
- Action-level loading/disabled states (prevent duplicate submits)
- Toast notifications for success/error feedback
- Field-level validation errors from Laravel `422` responses
- Unauthorized response handling (`401`)
- Current signed-in user shown in the app header
- In-app confirmation modal for project and task deletion
- Backend feature tests for auth and authorization rules
- Backend feature tests for validation and forbidden-access cases
- Frontend integration tests for auth, validation, task create, and inline task edit flows
- Live production deployment on Railway + Vercel
- Production smoke-tested auth, project, task, refresh, and logout/login flows
- First-time empty-state guidance for projects and tasks
- Production auth forms with loading/disabled states
- Custom app title and favicon for deployed branding
- Visual polish pass for auth screens, dashboard layout, and action cards
- Friendlier due date display formatting in task cards

## Commands You Used (CLI)

## Setup Commands

```powershell
# Create projects
composer create-project laravel/laravel backend
npm create vite@latest frontend -- --template react

# Frontend install
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npm i axios react-router-dom

# Backend install
cd ..\backend
php artisan install:api
php artisan migrate
```

## Laravel Generate Commands

```powershell
php artisan make:model Project -m
php artisan make:model Task -m
php artisan make:migration create_project_user_table
php artisan make:migration add_role_to_users_table --table=users

php artisan make:controller Api/AuthController
php artisan make:controller Api/ProjectController
php artisan make:controller Api/TaskController
```

## Runtime / Utility Commands

```powershell
# Backend
php artisan serve
php artisan optimize:clear
php artisan route:clear
php artisan route:list

# Frontend
npm run dev
npm run lint
```

## Test Commands

```powershell
# Frontend integration tests
npm test

# Auth endpoint tests
php artisan test --filter=AuthApiTest

# Authorization policy tests
php artisan test --filter=ProjectTaskAuthorizationTest

# Validation tests
php artisan test --filter=ProjectTaskValidationTest

# Forbidden access tests
php artisan test --filter=ProjectTaskForbiddenAccessTest

# Run all backend tests
php artisan test
```

## Frontend Test Coverage

### `App.test.jsx`
- renders login form when no token exists
- logs in and loads projects
- returns user to login screen when unauthorized callback is triggered
- shows project validation errors and keeps project form values on failed create
- shows task validation errors and keeps task form values on failed create
- creates a task successfully and refreshes the task list
- shows inline task edit validation errors and keeps edit values on failed save
- saves inline task edits successfully and refreshes the task row

## Backend Test Coverage

### `AuthApiTest`
- register creates a user and returns a token
- login returns a token for valid credentials
- `me` returns the authenticated user
- logout deletes the current token

### `ProjectTaskAuthorizationTest`
- admin can list all projects
- normal user sees only owned/member projects
- member cannot update a project they do not own
- member can view shared project tasks but cannot create tasks there
- admin can update and delete any task

### `ProjectTaskValidationTest`
- project creation requires `name`
- project update rejects empty `name`
- task creation requires `title`
- task update rejects invalid `status`
- task creation rejects invalid `due_date`
- task creation rejects invalid `assigned_to`
- invalid create requests do not write bad data to the database

### `ProjectTaskForbiddenAccessTest`
- unauthenticated users cannot access protected project routes
- non-members cannot view another project's tasks
- non-owners cannot delete another owner's task

## API Testing from CLI (PowerShell)

You tested API endpoints using `Invoke-RestMethod`:
- Register
- Login
- Protected routes with `Authorization: Bearer <token>`
- Project/task CRUD

## Current Learning Map (What You Are Doing)

You are following real full-stack flow:
1. Design database and relationships
2. Build and validate API endpoints
3. Test API directly (CLI/Postman)
4. Build frontend components
5. Connect frontend to backend
6. Add UX reliability (loading/errors/pagination)

If you feel lost: that is normal at this stage. You are now working at the integration layer, which is where real projects become professional-level.

## Next Recommended Steps

1. Add a small audit log (who updated/deleted tasks)
2. Add richer team/member management UI
3. Add member invitation/assignment flows
4. Add a custom domain and polish the deployed UI
5. Add password reset or email verification if you want a more complete auth flow

## Quick Start (Run Existing App)

```powershell
# Terminal 1
cd smart-task-manager\backend
php artisan serve

# Terminal 2
cd smart-task-manager\frontend
npm run dev
```

Open frontend at `http://localhost:5173`.

## Deployment Prep

### Current production setup

- Frontend host: Vercel
- Backend host: Railway
- Database: Railway PostgreSQL
- Frontend project root: `frontend`
- Backend service root: `backend`

### Backend checklist
- Set a production `APP_KEY`
- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Configure a real database instead of local SQLite if needed
- Set `SANCTUM_STATEFUL_DOMAINS` only if switching to cookie/session auth later
- Configure CORS allowed origin for your deployed frontend domain
- Backend CORS is configured through `FRONTEND_URL` in `backend/config/cors.php`
- Railway startup is pinned by `backend/Procfile`
- Recommended Railway env vars:
  - `APP_NAME=Smart Task Manager`
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_URL=<your-railway-backend-url>`
  - `FRONTEND_URL=<your-vercel-frontend-url>`
  - `DB_CONNECTION` and matching DB credentials if using Railway MySQL/Postgres
- Run:

```powershell
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend checklist
- Replace local API URL with deployed backend API URL
- Confirm `frontend/src/lib/api.js` points to the production API
- Add `VITE_API_URL=<your-railway-backend-url>/api` in Vercel project environment variables
- Local example file exists at `frontend/.env.example`
- Build the frontend:

```powershell
npm run build
```

### Suggested deployment targets
- Backend:
  - Railway
  - Laravel Forge / VPS
  - Render (Docker-based for Laravel)
- Frontend:
  - Vercel
  - Netlify

### Recommended deployment order
1. Deploy backend to Railway first
2. Copy the Railway public backend URL
3. Set `VITE_API_URL` in Vercel
4. Deploy frontend to Vercel
5. Update backend CORS/frontend URL settings if needed

### Railway backend env var checklist

Required app vars:
- `APP_NAME=Smart Task Manager`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generated-laravel-app-key>`
- `APP_URL=<your-railway-backend-url>`
- `FRONTEND_URL=<your-vercel-frontend-url>`
- `LOG_CHANNEL=stack`
- `LOG_LEVEL=info`

Database vars:
- If Railway provides a single `DATABASE_URL`, map it to:
  - `DB_URL=<railway-database-url>`
- Or set explicit values:
  - `DB_CONNECTION=mysql` or `DB_CONNECTION=pgsql`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_DATABASE`
  - `DB_USERNAME`
  - `DB_PASSWORD`

Session / cache / queue vars for this app:
- `SESSION_DRIVER=database`
- `CACHE_STORE=database`
- `QUEUE_CONNECTION=database`

Mail vars:
- For now you can keep local-style logging in production if email is not needed yet:
  - `MAIL_MAILER=log`

Why these matter:
- This project uses database-backed sessions, cache, and queue configuration by default.
- That means your production database must have the framework tables created by migrations.

### Railway deploy commands

Use these after the backend is deployed and env vars are set:

```powershell
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Generate `APP_KEY`

Locally, from `backend`:

```powershell
php artisan key:generate --show
```

Copy the output into Railway as `APP_KEY`.

## Deployment Runbook

### 1. Prepare local values

From `backend`, generate an app key:

```powershell
php artisan key:generate --show
```

Save these values for later:
- generated `APP_KEY`
- your future Railway backend URL
- your future Vercel frontend URL

### 2. Create the Railway backend project

In Railway:
1. Create a new project
2. Connect the GitHub repository
3. Point Railway to the `backend` folder if it asks for the service root
4. Add a database service if you do not already have one

### 3. Configure Railway backend environment variables

Set these values in the Railway service:

```txt
APP_NAME=Smart Task Manager
APP_ENV=production
APP_DEBUG=false
APP_KEY=<generated-app-key>
APP_URL=<your-railway-backend-url>
FRONTEND_URL=<your-vercel-frontend-url-or-placeholder>
LOG_CHANNEL=stack
LOG_LEVEL=info
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
MAIL_MAILER=log
```

Database:
- If Railway gives you `DATABASE_URL`, set:
```txt
DB_URL=<railway-database-url>
```
- Otherwise set:
```txt
DB_CONNECTION=mysql
DB_HOST=<host>
DB_PORT=<port>
DB_DATABASE=<database>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

### 4. Deploy the Railway backend

After Railway builds and deploys:
1. Open the deployment shell / command runner
2. Run:

```powershell
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Smoke test the backend

Verify these endpoints from browser, CLI, or Postman:
1. `GET /up`
2. `POST /api/login`
3. `GET /api/projects` with a Bearer token

If login works and protected routes respond correctly, the backend is ready.

### 6. Create the Vercel frontend project

In Vercel:
1. Import the same GitHub repository
2. Set the project root to `frontend`
3. Add this environment variable:

```txt
VITE_API_URL=<your-railway-backend-url>/api
```

4. Deploy

### 7. Update Railway frontend origin

After Vercel gives you the frontend URL:
1. Go back to Railway
2. Update:

```txt
FRONTEND_URL=<your-vercel-frontend-url>
```

3. Redeploy backend if needed

### 8. Verify the deployed app end to end

Check this exact flow:
1. open frontend
2. login
3. create project
4. create task
5. edit task inline
6. refresh page
7. login again if token/session is invalid

### 9. If deployment fails

Check in this order:
1. Railway env vars
2. database connection
3. `APP_KEY`
4. `VITE_API_URL`
5. `FRONTEND_URL`
6. backend logs
7. browser network tab

### Minimum deployment verification
After deploying, verify:
1. login works
2. projects load
3. task create works
4. inline task edit works
5. protected routes reject missing tokens

### Production verification completed

Verified on the live deployment:
1. login works on Vercel frontend against Railway backend
2. public registration works and logs users in automatically
3. projects can be created and selected
4. projects can be edited inline and deleted through confirmation modal
5. tasks can be created, updated, and deleted through confirmation modal
6. current signed-in user is displayed in the header
7. polished dashboard UI is deployed with readable status labels and due dates
8. data persists after browser refresh
9. data persists after logout and login again
10. Railway database migrations completed successfully in the deployed environment

## Troubleshooting

### 1) `Unauthenticated.` on protected routes

Cause:
- Missing or expired token
- Logged out token reused

Fix:
- Login again and refresh `$token`
- Send header: `Authorization: Bearer <token>`
- Verify backend is running (`php artisan serve`)

### 2) `The route api/projects/{id}/tasks could not be found.`

Cause:
- Task routes missing in `backend/routes/api.php`
- Route cache not refreshed

Fix:
```powershell
php artisan optimize:clear
php artisan route:clear
php artisan route:list | Select-String "projects/.*/tasks"
```

### 3) `Call to undefined method App\\Models\\User::createToken()`

Cause:
- `User` model missing Sanctum trait

Fix:
- In `backend/app/Models/User.php` use:
```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

### 4) 500 errors on auth routes (`Function () does not exist`)

Cause:
- Incorrect route action syntax or controller naming mismatch

Fix:
- Ensure `routes/api.php` uses:
```php
Route::post('/register', [AuthController::class, 'register']);
```
- Ensure filename/class are exactly `AuthController.php` / `AuthController`

### 5) Frontend logs in but API calls fail

Cause:
- Token not attached in Axios
- Wrong API base URL

Fix:
- Check `frontend/src/lib/api.js`:
  - `baseURL: "http://127.0.0.1:8000/api"`
  - Request interceptor attaches Bearer token from `localStorage`

### 6) Pagination shows invalid page state (example: `Page 2 / 1`)

Cause:
- Stale pagination state after filter/project switch

Fix:
- Reset pagination when selecting/deleting project
- Clamp page values in state update:
```js
currentPage: Math.min(current, last)
```

### 7) Buttons trigger unexpected behavior

Cause:
- Buttons inside forms default to submit

Fix:
- For non-submit actions (`Edit`, `Delete`, `Prev`, `Next`, `Cancel`) set:
```jsx
type="button"
```

### 8) Useful recovery sequence

If things feel broken, run:
```powershell
# Backend
cd smart-task-manager\backend
php artisan optimize:clear
php artisan route:clear
php artisan serve

# Frontend (new terminal)
cd smart-task-manager\frontend
npm run lint
npm run dev
```

Then login again and retest one endpoint at a time.

### 9) Validation errors show only generic message

Cause:
- Laravel returns `422` with `errors` object, but UI only reads `message`

Fix:
- Map `err.response.data.errors` in `App.jsx`
- Pass field errors to panel components
- Render errors under each related input

### 10) Inline task edit closes but changes are not saved

Cause:
- `onUpdateTask` result not checked, or empty title submitted

Fix:
- In `onUpdateTask`, return `{ ok, fieldErrors }`
- In `TasksPanel.saveEdit`, only `cancelEdit()` when `ok === true`
- Block save if edited title is empty after trim
