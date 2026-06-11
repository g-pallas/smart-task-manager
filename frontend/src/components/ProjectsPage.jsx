import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import FaqButton from "./FaqButton";
import NotificationBell from "./NotificationBell";

const getProgress = (project) => {
  const total = project.tasks_count ?? 0;
  if (!total) return 0;
  return Math.round(((project.completed_tasks_count ?? 0) / total) * 100);
};

const getProjectState = (project) => {
  const dueDate = project.tasks_min_due_date ? new Date(project.tasks_min_due_date) : null;
  const progress = getProgress(project);

  if (dueDate && dueDate < new Date() && progress < 100) {
    return { label: "Urgent", className: "project-page-status-urgent" };
  }
  if (progress > 0 && progress < 100) {
    return { label: "In Progress", className: "project-page-status-progress" };
  }
  return { label: progress === 100 ? "Complete" : "Planning", className: "project-page-status-planning" };
};

const getDueLabel = (project) => {
  if (!project.tasks_min_due_date) return "No due tasks";

  const due = new Date(project.tasks_min_due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);

  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
};

const formatDate = (value) => {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const activityLabels = {
  project_created: "Project created",
  project_updated: "Project updated",
  project_deleted: "Project moved to trash",
  project_archived: "Project archived",
  project_restored: "Project restored",
  project_restored_from_trash: "Project restored from trash",
  project_permanently_deleted: "Project permanently deleted",
  task_created: "Task created",
  task_updated: "Task updated",
  task_completed: "Task completed",
  task_reopened: "Task reopened",
  task_status_changed: "Task status changed",
  task_deleted: "Task moved to trash",
  task_archived: "Task archived",
  task_restored: "Task restored",
  task_restored_from_trash: "Task restored from trash",
  task_permanently_deleted: "Task permanently deleted",
};

const formatActivityTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function ProjectsPage({
  projects,
  currentUser,
  loading,
  error,
  formErrors,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onArchiveProject,
  onSelectProject,
  workspaceSummary,
  onOptimizeSchedule,
  onUpdatePriority,
  createRequest,
  notificationProps,
  onOpenFaq,
}) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [prioritySavingId, setPrioritySavingId] = useState(null);
  const nameInputRef = useRef(null);
  const priorityProject = workspaceSummary?.priority_project ?? null;
  const activities = workspaceSummary?.activities ?? [];
  const health = workspaceSummary?.health ?? {};
  const healthTotal = (health.todo ?? 0) + (health.in_progress ?? 0) + (health.done ?? 0);

  useEffect(() => {
    if (!createRequest) return;
    setShowCreate(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [createRequest]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) =>
      `${project.name ?? ""} ${project.description ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  const submitProject = async (e) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const ok = await onCreateProject({ name, description });
      if (ok) {
        setName("");
        setDescription("");
        setShowCreate(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (project) => {
    if (savingId !== null || deletingId !== null) return;
    setEditingId(project.id);
    setEditName(project.name ?? "");
    setEditDescription(project.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async (project) => {
    if (!editName.trim() || savingId !== null) return;

    setSavingId(project.id);
    try {
      const result = await onUpdateProject(project.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      if (result?.ok) cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setDeletingId(projectToDelete.id);
    try {
      await onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="projects-page">
      <header className="projects-page-header">
        <div>
          <h1>Active Projects</h1>
          <p>Curating your workspace flow</p>
        </div>
        <label className="search-box project-search-box">
          <svg
            aria-hidden="true"
            className="ui-icon"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="topbar-actions">
          <NotificationBell {...notificationProps} />
          <FaqButton onClick={onOpenFaq} />
          <button className="avatar-button" type="button">
            {(currentUser?.name || currentUser?.email || "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <div className="projects-page-grid">
        <div className="project-page-list">
          {loading && <p className="inline-status">Loading projects...</p>}
          {error && <p className="dashboard-error">{error}</p>}

          {filteredProjects.map((project) => {
            const state = getProjectState(project);
            const progress = getProgress(project);
            const dueDate = formatDate(project.tasks_min_due_date);
            const isManualPriority =
              priorityProject?.source === "manual" && priorityProject.id === project.id;

            return (
              <article className="project-page-card" key={project.id}>
                {editingId === project.id ? (
                  <div className="edit-stack">
                    <input
                      className="app-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Project name"
                      disabled={savingId !== null}
                    />
                    <textarea
                      className="app-textarea"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Project description"
                      disabled={savingId !== null}
                    />
                    <div className="action-row">
                      <button className="btn btn-primary" type="button" onClick={() => saveEdit(project)}>
                        {savingId === project.id ? "Saving..." : "Save"}
                      </button>
                      <button className="btn btn-muted" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="project-page-card-menu">
                      <button
                        type="button"
                        aria-label={`Archive ${project.name}`}
                        onClick={() => onArchiveProject(project.id)}
                        title="Archive project"
                      >
                        ...
                      </button>
                    </div>
                    <div className="project-page-card-meta">
                      <span className={`project-page-status ${state.className}`}>
                        {state.label}
                      </span>
                      {isManualPriority && (
                        <span className="project-priority-badge">Priority</span>
                      )}
                      <span>{getDueLabel(project)}</span>
                    </div>
                    <button
                      className="project-page-select"
                      type="button"
                      onClick={() => onSelectProject(project)}
                    >
                      <h2>{project.name}</h2>
                      <p>{project.description || "Planning, execution, and delivery workspace."}</p>
                    </button>
                    <div className="project-page-progress-row">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="project-page-progress-track">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className="project-page-card-footer">
                      <div className="member-stack" aria-label="Project members">
                        <span>{(currentUser?.name || "A").slice(0, 1).toUpperCase()}</span>
                        <span>{project.tasks_count ?? 0} tasks</span>
                      </div>
                      <time>{dueDate}</time>
                    </div>
                    <div className="project-page-actions">
                      <button className="text-link" type="button" onClick={() => startEdit(project)}>
                        Edit
                      </button>
                      <button
                        className="text-link text-link-danger"
                        type="button"
                        onClick={() => setProjectToDelete(project)}
                      >
                        {deletingId === project.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        className="text-link"
                        type="button"
                        onClick={() => onArchiveProject(project.id)}
                      >
                        Archive
                      </button>
                      <button
                        className="text-link"
                        type="button"
                        disabled={prioritySavingId !== null}
                        onClick={async () => {
                          setPrioritySavingId(project.id);
                          try {
                            await onUpdatePriority(isManualPriority ? null : project.id);
                          } finally {
                            setPrioritySavingId(null);
                          }
                        }}
                      >
                        {prioritySavingId === project.id
                          ? "Saving..."
                          : isManualPriority
                            ? "Clear Priority"
                            : "Set Priority"}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}

          {!loading && filteredProjects.length === 0 && (
            <div className="empty-dashboard-state">
              <p>No projects found.</p>
              <span>Create a new project or adjust your search.</span>
            </div>
          )}

          {showCreate && (
            <form className="project-create-card" onSubmit={submitProject}>
              <input
                ref={nameInputRef}
                className="app-input"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
                required
              />
              {formErrors?.name?.[0] && (
                <p className="text-sm text-red-600">{formErrors.name[0]}</p>
              )}
              <textarea
                className="app-textarea"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
              />
              <div className="action-row">
                <button className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
                <button
                  className="btn btn-muted"
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="project-page-aside">
          <section className="insight-card">
            <h2>Workspace Priority</h2>
            {priorityProject ? (
              <p>
                Focus on <strong>{priorityProject.name}</strong>.{" "}
                {priorityProject.overdue_tasks_count > 0
                  ? `${priorityProject.overdue_tasks_count} overdue task${priorityProject.overdue_tasks_count === 1 ? "" : "s"} need attention.`
                  : `Its next task is due ${formatDate(priorityProject.next_due_date)}.`}
              </p>
            ) : (
              <p>Create a project with dated tasks to receive a workspace priority.</p>
            )}
            <button type="button" onClick={onOptimizeSchedule} disabled={!priorityProject}>
              Open Priority Project
            </button>
          </section>

          <section className="timeline-card">
            <h2>Activity Timeline</h2>
            {activities.length ? (
              <div className="timeline-list">
                {activities.map((activity, index) => (
                  <div
                    className={`timeline-item ${index % 3 === 1 ? "timeline-red" : index % 3 === 2 ? "timeline-indigo" : "timeline-blue"}`}
                    key={activity.id}
                  >
                    <strong>{activityLabels[activity.action] || "Workspace updated"}</strong>
                    <span>{activity.subject_name} · {activity.actor_name || "User"}</span>
                    <time>{formatActivityTime(activity.created_at)}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="timeline-empty">Workspace activity will appear here as you work.</p>
            )}
          </section>

          <section className="health-card">
            <h2>Project Health</h2>
            <div className="health-row">
              <span>Task completion</span>
              <strong>{healthTotal ? Math.round(((health.done ?? 0) / healthTotal) * 100) : 0}%</strong>
            </div>
            <div className="health-meter">
              <span style={{ flex: health.done || 0 }} title={`${health.done ?? 0} done`} />
              <span style={{ flex: health.in_progress || 0 }} title={`${health.in_progress ?? 0} in progress`} />
              <span style={{ flex: health.todo || 0 }} title={`${health.todo ?? 0} to do`} />
            </div>
            <p>
              {health.done ?? 0} done, {health.in_progress ?? 0} in progress,{" "}
              {health.todo ?? 0} to do, and {health.overdue ?? 0} overdue.
            </p>
          </section>
        </aside>
      </div>

      <button className="floating-project-button" type="button" onClick={() => setShowCreate(true)}>
        +
      </button>

      {projectToDelete && (
        <ConfirmModal
          title="Delete project?"
          message={`This will permanently remove "${projectToDelete.name}" and its tasks.`}
          confirmLabel="Delete project"
          busy={deletingId === projectToDelete.id}
          onCancel={() => {
            if (deletingId === null) setProjectToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}
