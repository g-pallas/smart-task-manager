import { useEffect, useRef, useState } from "react";
import api, { setUnauthorizedHandler } from "./lib/api";
import ArchivePage from "./components/ArchivePage";
import CalendarPage from "./components/CalendarPage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProjectsPage from "./components/ProjectsPage";
import ProjectsPanel from "./components/ProjectsPanel";
import SettingsPage from "./components/SettingsPage";
import TasksPanel from "./components/TasksPanel";
import TrashPage from "./components/TrashPage";

const DashboardIcon = ({ children }) => (
  <svg
    aria-hidden="true"
    className="ui-icon"
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    {children}
  </svg>
);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [activeView, setActiveView] = useState("dashboard");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [authFormErrors, setAuthFormErrors] = useState({});
  const [authLoading, setAuthLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [calendarItems, setCalendarItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [settingsErrors, setSettingsErrors] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success" });
  const toastTimeoutRef = useRef(null);
  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      showToast("Session expired. Please log in again.", "error");
      setToken(null);
      setCurrentUser(null);
      setAuthMode("login");
      setAuthFormErrors({});
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      setCalendarItems([]);
      setArchiveItems([]);
      setTrashItems([]);
      setTaskPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
      });
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message, type = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: "", type: "success" });
      toastTimeoutRef.current = null;
    }, 2400);
  };

  const getFieldErrors = (err) => {
    if (err?.response?.status === 422) {
      return err?.response?.data?.errors ?? {};
    }

    return {};
  };

  useEffect(() => {
    if (token) {
      loadCurrentUser();
      loadProjects();
      loadCalendarItems();
      loadArchiveItems();
      loadTrashItems();
    }
  }, [token]);

  const loadCurrentUser = async () => {
    try {
      const res = await api.get("/me");
      setCurrentUser(res.data ?? null);
    } catch {
      setCurrentUser(null);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError("");
    try {
      const res = await api.get("/projects");
      setProjects(res.data.data ?? []);
    } catch (err) {
      setProjectsError(
        err?.response?.data?.message || "Failed to load projects.",
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadCalendarItems = async (params = {}) => {
    try {
      const res = await api.get("/calendar-events", { params });
      setCalendarItems(res.data.data ?? []);
    } catch {
      setCalendarItems([]);
    }
  };

  const loadArchiveItems = async (params = {}) => {
    try {
      const res = await api.get("/archive", { params });
      setArchiveItems(res.data.data ?? []);
    } catch {
      setArchiveItems([]);
    }
  };

  const loadTrashItems = async (params = {}) => {
    try {
      const res = await api.get("/trash", { params });
      setTrashItems(res.data.data ?? []);
    } catch {
      setTrashItems([]);
    }
  };

  const loadTasks = async (projectId, params = {}) => {
    setTasksLoading(true);
    setTasksError("");
    try {
      const res = await api.get(`/projects/${projectId}/tasks`, { params });
      const payload = res.data ?? {};
      const current = payload.current_page ?? 1;
      const last = Math.max(payload.last_page ?? 1, 1);
      setTasks(payload.data ?? []);
      setTaskPagination({
        currentPage: Math.min(current, last),
        lastPage: last,
        total: payload.total ?? 0,
        from: payload.from ?? 0,
        to: payload.to ?? 0,
      });
    } catch (err) {
      setTasksError(err?.response?.data?.message || "Failed to load tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setAuthFormErrors({});
    setAuthLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user ?? null);
      showToast("Logged in.");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        "Failed to sign in. Check the API URL and CORS settings.";
      showToast(message, "error");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (payload) => {
    setAuthFormErrors({});
    setAuthLoading(true);
    try {
      const res = await api.post("/register", payload);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user ?? null);
      setAuthMode("login");
      showToast("Account created.");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to create account.";
      setAuthFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setCurrentUser(null);
      setActiveView("dashboard");
      setAuthMode("login");
      setAuthFormErrors({});
      setSettingsErrors({});
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      setCalendarItems([]);
      setArchiveItems([]);
      setTrashItems([]);
      setTaskPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
      });
    }
  };

  const createProject = async ({ name, description }) => {
    setProjectsError("");
    setProjectFormErrors({});
    try {
      await api.post("/projects", { name, description });
      await loadProjects();
      await loadCalendarItems();
      showToast("Project created.");
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create project.";
      setProjectsError(message);
      setProjectFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    }
  };

  const updateProject = async (projectId, payload) => {
    setProjectsError("");
    try {
      await api.put(`/projects/${projectId}`, payload);
      await loadProjects();
      await loadCalendarItems();

      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, ...payload } : prev));
      }
      showToast("Project updated.");
      return { ok: true, fieldErrors: {} };
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update project.";
      setProjectsError(message);
      showToast(message, "error");
      return { ok: false, fieldErrors: getFieldErrors(err) };
    }
  };

  const deleteProject = async (projectId) => {
    setProjectsError("");
    try {
      await api.delete(`/projects/${projectId}`);
      await loadProjects();
      await loadTrashItems();
      await loadCalendarItems();

      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setTasks([]);
        setTaskPagination({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          from: 0,
          to: 0,
        });
      }
      showToast("Project deleted.");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete project.";
      setProjectsError(message);
      showToast(message, "error");
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    setTaskPagination({
      currentPage: 1,
      lastPage: 1,
      total: 0,
      from: 0,
      to: 0,
    });
    await loadTasks(project.id, { page: 1 });
  };

  const createTask = async (payload, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    setTaskFormErrors({});
    try {
      await api.post(`/projects/${selectedProject.id}/tasks`, payload);
      await loadTasks(selectedProject.id, params);
      await loadProjects();
      await loadCalendarItems();
      showToast("Task created.");
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create task.";
      setTasksError(message);
      setTaskFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    }
  };

  const updateTask = async (taskId, payload, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.put(`/projects/${selectedProject.id}/tasks/${taskId}`, payload);
      await loadTasks(selectedProject.id, params);
      await loadProjects();
      await loadCalendarItems();
      showToast("Task updated.");
      return { ok: true, fieldErrors: {} };
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update task.";
      setTasksError(message);
      showToast(message, "error");
      return { ok: false, fieldErrors: getFieldErrors(err) };
    }
  };

  const updateTaskStatus = async (taskId, status, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.put(`/projects/${selectedProject.id}/tasks/${taskId}`, {
        status,
      });
      await loadTasks(selectedProject.id, params);
      await loadProjects();
      await loadCalendarItems();
      showToast("Task status updated.");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to update task status.";
      setTasksError(message);
      showToast(message, "error");
    }
  };

  const deleteTask = async (taskId, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.delete(`/projects/${selectedProject.id}/tasks/${taskId}`);
      await loadTasks(selectedProject.id, params);
      await loadProjects();
      await loadTrashItems();
      await loadCalendarItems();
      showToast("Task deleted.");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete task.";
      setTasksError(message);
      showToast(message, "error");
    }
  };

  const archiveProject = async (projectId) => {
    await api.post(`/projects/${projectId}/archive`);
    await loadProjects();
    await loadArchiveItems();
    await loadCalendarItems();
    showToast("Project archived.");
  };

  const archiveTask = async (projectId, taskId, params = {}) => {
    await api.post(`/projects/${projectId}/tasks/${taskId}/archive`);
    await loadTasks(projectId, params);
    await loadProjects();
    await loadArchiveItems();
    await loadCalendarItems();
    showToast("Task archived.");
  };

  const restoreArchiveItem = async (item) => {
    if (item.type === "project") {
      await api.post(`/projects/${item.id}/restore-archive`);
    } else {
      await api.post(`/projects/${item.project_id}/tasks/${item.id}/restore-archive`);
    }
    await loadProjects();
    await loadArchiveItems();
    await loadCalendarItems();
    showToast("Archive item restored.");
  };

  const restoreTrashItem = async (item) => {
    await api.post(`/trash/${item.type === "project" ? "projects" : "tasks"}/${item.id}/restore`);
    await loadProjects();
    await loadTrashItems();
    await loadCalendarItems();
    showToast("Trash item restored.");
  };

  const permanentlyDeleteTrashItem = async (item) => {
    await api.delete(`/trash/${item.type === "project" ? "projects" : "tasks"}/${item.id}`);
    await loadTrashItems();
    showToast("Item permanently deleted.");
  };

  const emptyTrash = async () => {
    await api.post("/trash/empty");
    await loadTrashItems();
    showToast("Trash emptied.");
  };

  const createCalendarEvent = async (payload) => {
    await api.post("/calendar-events", payload);
    await loadCalendarItems();
    showToast("Event created.");
  };

  const deleteCalendarEvent = async (eventId) => {
    await api.delete(`/calendar-events/${eventId}`);
    await loadCalendarItems();
    showToast("Event deleted.");
  };

  const updateProfile = async (payload) => {
    setSettingsErrors({});
    try {
      const res = await api.put("/me", payload);
      setCurrentUser(res.data);
      showToast("Profile updated.");
      return true;
    } catch (err) {
      setSettingsErrors(getFieldErrors(err));
      showToast(err?.response?.data?.message || "Failed to update profile.", "error");
      return false;
    }
  };

  const updatePassword = async (payload) => {
    setSettingsErrors({});
    try {
      await api.put("/me/password", payload);
      showToast("Password updated.");
      return true;
    } catch (err) {
      setSettingsErrors(getFieldErrors(err));
      showToast(err?.response?.data?.message || "Failed to update password.", "error");
      return false;
    }
  };

  const updatePreferences = async (preferences) => {
    const res = await api.put("/me/preferences", preferences);
    setCurrentUser((prev) => (prev ? { ...prev, preferences: res.data.preferences } : prev));
    showToast("Preferences saved.");
  };

  const toastNode = toast.message ? (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={`toast-card text-sm font-medium text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}
      >
        {toast.message}
      </div>
    </div>
  ) : null;

  const userName = currentUser?.name || currentUser?.email || "there";
  const totalTasks = projects.reduce((sum, project) => sum + (project.tasks_count ?? 0), 0);
  const completedTasks = projects.reduce((sum, project) => sum + (project.completed_tasks_count ?? 0), 0);
  const urgentTasks = calendarItems.filter((item) => item.type === "task" && item.status !== "done").length;
  const taskVelocity = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;
  const hoursTracked = (projects.length * 4.5 + totalTasks * 1.25).toFixed(1);
  const dashboardQuery = dashboardSearch.trim().toLowerCase();
  const dashboardProjects = dashboardQuery
    ? projects.filter((project) =>
        `${project.name ?? ""} ${project.description ?? ""}`.toLowerCase().includes(dashboardQuery),
      )
    : projects;
  const dashboardTasks = dashboardQuery
    ? tasks.filter((task) =>
        `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase().includes(dashboardQuery),
      )
    : tasks;

  if (!token) {
    return (
      <>
        {toastNode}
        {authMode === "login" ? (
          <LoginForm
            onLogin={login}
            loading={authLoading}
            onSwitchToRegister={() => {
              if (authLoading) return;
              setAuthFormErrors({});
              setAuthMode("register");
            }}
          />
        ) : (
          <RegisterForm
            onRegister={register}
            loading={authLoading}
            formErrors={authFormErrors}
            onSwitchToLogin={() => {
              if (authLoading) return;
              setAuthFormErrors({});
              setAuthMode("login");
            }}
          />
        )}
      </>
    );
  }

  return (
    <main className="app-page dashboard-page">
      {toastNode}
      <div className="dashboard-frame">
        <aside className="dashboard-sidebar">
          <div>
            <p className="brand-mark">
              {activeView === "projects" ? "Personal Manager" : "TheCurator"}
            </p>
            <p className="brand-kicker">
              {activeView === "projects" ? "Intelligent Flow" : "Personal Manager"}
            </p>
          </div>

          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button
              className={`nav-item ${activeView === "dashboard" ? "nav-item-active" : ""}`}
              type="button"
              onClick={() => setActiveView("dashboard")}
            >
              <DashboardIcon>
                <rect height="7" width="7" x="3" y="3" />
                <rect height="7" width="7" x="14" y="3" />
                <rect height="7" width="7" x="14" y="14" />
                <rect height="7" width="7" x="3" y="14" />
              </DashboardIcon>
              Dashboard
            </button>
            <button
              className={`nav-item ${activeView === "projects" ? "nav-item-active" : ""}`}
              type="button"
              onClick={() => setActiveView("projects")}
            >
              <DashboardIcon>
                <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
              </DashboardIcon>
              Projects
            </button>
            <button
              className={`nav-item ${activeView === "calendar" ? "nav-item-active" : ""}`}
              type="button"
              onClick={() => setActiveView("calendar")}
            >
              <DashboardIcon>
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect height="18" rx="2" width="18" x="3" y="4" />
                <path d="M3 10h18" />
              </DashboardIcon>
              Calendar
            </button>
            <button
              className={`nav-item ${activeView === "settings" ? "nav-item-active nav-item-attention" : ""}`}
              type="button"
              onClick={() => setActiveView("settings")}
            >
              <DashboardIcon>
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.64V21a2 2 0 1 1-4 0v-.09a1.8 1.8 0 0 0-1-1.64 1.8 1.8 0 0 0-2 .36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.64-1H3a2 2 0 1 1 0-4h.09a1.8 1.8 0 0 0 1.64-1 1.8 1.8 0 0 0-.36-2l-.06-.06A2 2 0 1 1 7.14 3.9l.06.06a1.8 1.8 0 0 0 2 .36h.01A1.8 1.8 0 0 0 10.2 2.7V2a2 2 0 1 1 4 0v.09a1.8 1.8 0 0 0 1 1.64 1.8 1.8 0 0 0 2-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.8 1.8 0 0 0-.36 2v.01A1.8 1.8 0 0 0 21.3 10H22a2 2 0 1 1 0 4h-.09a1.8 1.8 0 0 0-1.64 1Z" />
              </DashboardIcon>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <button
              className="btn btn-secondary w-full"
              type="button"
              onClick={() => setActiveView("projects")}
            >
              + New {activeView === "projects" ? "Project" : "Task"}
            </button>
            <div className="archive-links">
              <button
                className={`nav-item nav-item-small ${activeView === "archive" ? "nav-item-active nav-item-attention" : ""}`}
                type="button"
                onClick={() => setActiveView("archive")}
              >
                Archive
              </button>
              <button
                className={`nav-item nav-item-small ${activeView === "trash" ? "nav-item-active nav-item-attention" : ""}`}
                type="button"
                onClick={() => setActiveView("trash")}
              >
                Trash
              </button>
              <button
                className="nav-item nav-item-small nav-item-logout"
                type="button"
                onClick={logout}
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <section className={`dashboard-main ${activeView !== "dashboard" ? "projects-main" : ""}`}>
          {activeView === "projects" ? (
            <ProjectsPage
              projects={projects}
              currentUser={currentUser}
              loading={projectsLoading}
              error={projectsError}
              formErrors={projectFormErrors}
              onCreateProject={createProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onArchiveProject={archiveProject}
              onSelectProject={selectProject}
            />
          ) : activeView === "calendar" ? (
            <CalendarPage
              items={calendarItems}
              tasks={tasks}
              projects={projects}
              currentUser={currentUser}
              onCreateEvent={createCalendarEvent}
              onDeleteEvent={deleteCalendarEvent}
              onSearch={loadCalendarItems}
            />
          ) : activeView === "settings" ? (
            <SettingsPage
              currentUser={currentUser}
              errors={settingsErrors}
              onUpdateProfile={updateProfile}
              onUpdatePassword={updatePassword}
              onUpdatePreferences={updatePreferences}
            />
          ) : activeView === "archive" ? (
            <ArchivePage
              currentUser={currentUser}
              items={archiveItems}
              onRestore={restoreArchiveItem}
              onSearch={loadArchiveItems}
            />
          ) : activeView === "trash" ? (
            <TrashPage
              items={trashItems}
              onRestore={restoreTrashItem}
              onPermanentDelete={permanentlyDeleteTrashItem}
              onEmptyTrash={emptyTrash}
              onSearch={loadTrashItems}
            />
          ) : (
            <>
          <header className="dashboard-topbar">
            <div className="app-wordmark">TaskCurator</div>
            <label className="search-box">
              <DashboardIcon>
                <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </DashboardIcon>
              <input
                placeholder="Search intentions..."
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
              />
            </label>
            <div className="topbar-actions">
              <button className="icon-button" type="button" aria-label="Notifications">
                <DashboardIcon>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
                </DashboardIcon>
              </button>
              <button className="icon-button" type="button" aria-label="Help">
                <DashboardIcon>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-.9.6-1.5 1.1-1.5 2.2" />
                  <path d="M12 17h.01" />
                </DashboardIcon>
              </button>
              <button
                onClick={logout}
                className="avatar-button"
                type="button"
                title="Logout"
              >
                {(currentUser?.name || currentUser?.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </button>
            </div>
          </header>

          <section className="welcome-strip">
            <h1>Good morning, {userName.split(" ")[0]}.</h1>
            <p>
              You have <strong>{urgentTasks} urgent</strong> tasks requiring
              your focus today.
            </p>
          </section>

          <section className="metric-grid" aria-label="Workspace metrics">
            <article className="metric-card">
              <div className="metric-card-head">
                <span>Active Projects</span>
                <DashboardIcon>
                  <rect height="6" width="6" x="4" y="4" />
                  <rect height="6" width="6" x="14" y="4" />
                  <rect height="6" width="6" x="14" y="14" />
                </DashboardIcon>
              </div>
              <p className="metric-value">{projects.length}</p>
              <span className="metric-delta">+2 this week</span>
            </article>
            <article className="metric-card">
              <div className="metric-card-head">
                <span>Task Velocity</span>
                <DashboardIcon>
                  <path d="M4 14a8 8 0 0 1 16 0M12 14l4-4M5 18h14" />
                </DashboardIcon>
              </div>
              <p className="metric-value">{taskVelocity}%</p>
              <span className="metric-muted">vs 72% avg</span>
            </article>
            <article className="metric-card">
              <div className="metric-card-head">
                <span>Hours Tracked</span>
                <DashboardIcon>
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5" />
                  <path d="M9 2h6" />
                </DashboardIcon>
              </div>
              <p className="metric-value">{hoursTracked}</p>
              <span className="metric-muted">hours</span>
            </article>
          </section>

          <div className="dashboard-content-grid">
            <ProjectsPanel
              projects={dashboardProjects}
              selectedProject={selectedProject}
              onCreateProject={createProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onArchiveProject={archiveProject}
              onSelectProject={selectProject}
              loading={projectsLoading}
              error={projectsError}
              formErrors={projectFormErrors}
            />

            <TasksPanel
              selectedProject={selectedProject}
              tasks={dashboardTasks}
              onCreateTask={createTask}
              onUpdateTaskStatus={updateTaskStatus}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onArchiveTask={archiveTask}
              onLoadTasks={loadTasks}
              loading={tasksLoading}
              error={tasksError}
              pagination={taskPagination}
              formErrors={taskFormErrors}
            />
          </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
