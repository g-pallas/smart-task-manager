import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function ProjectsPanel({
  projects,
  selectedProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onArchiveProject,
  onSelectProject,
  loading,
  error,
  formErrors,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFormErrors, setEditFormErrors] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const ok = await onCreateProject({ name, description });
      if (ok) {
        setName("");
        setDescription("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (project) => {
    if (editingId !== null || deletingId !== null || savingId !== null) return;
    setEditingId(project.id);
    setEditName(project.name ?? "");
    setEditDescription(project.description ?? "");
    setEditFormErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditFormErrors({});
  };

  const saveEdit = async (project) => {
    const trimmedName = editName.trim();
    if (!trimmedName || savingId !== null) {
      if (!trimmedName) {
        setEditFormErrors({ name: ["The project name field is required."] });
      }
      return;
    }

    setEditFormErrors({});
    setSavingId(project.id);
    try {
      const result = await onUpdateProject(project.id, {
        name: trimmedName,
        description: editDescription.trim(),
      });

      if (result?.ok) {
        cancelEdit();
      } else {
        setEditFormErrors(result?.fieldErrors ?? {});
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (project) => {
    if (editingId !== null || deletingId !== null) return;
    setProjectToDelete(project);
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

  const getProjectProgress = (project) => {
    const total = project.tasks_count ?? 0;
    if (!total) return 0;
    return Math.round(((project.completed_tasks_count ?? 0) / total) * 100);
  };

  const getProjectState = (project) => {
    const progress = getProjectProgress(project);
    const dueDate = project.tasks_min_due_date ? new Date(project.tasks_min_due_date) : null;

    if (dueDate && dueDate < new Date() && progress < 100) return "critical";
    if (progress > 0 && progress < 100) return "in progress";
    if (progress === 100) return "done";
    return "planning";
  };

  return (
    <section className="project-overview">
      <div className="section-heading-row">
        <h2>Project Overview</h2>
        <button className="text-link" type="button">
          View All
        </button>
      </div>

      {loading && (
        <p className="inline-status">Loading projects...</p>
      )}
      {error && (
        <p className="dashboard-error">{error}</p>
      )}

      <div className="project-list">
        {projects.map((p) => {
          const isRowBusy =
            editingId === p.id || deletingId === p.id || savingId === p.id;
          const isAnyProjectActionBusy =
            editingId !== null ||
            deletingId !== null ||
            savingId !== null ||
            isCreating;
          const progress = getProjectProgress(p);
          const projectState = getProjectState(p);

          return (
            <div
              key={p.id}
              className={`project-card dashboard-project-card ${
                selectedProject?.id === p.id
                  ? "project-card-active"
                  : ""
              }`}
            >
              {editingId === p.id ? (
                <div className="edit-stack">
                  <input
                    className="app-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                    disabled={savingId !== null}
                  />
                  {editFormErrors?.name?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.name[0]}
                    </p>
                  )}

                  <textarea
                    className="app-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project description"
                    disabled={savingId !== null}
                  />
                  {editFormErrors?.description?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.description[0]}
                    </p>
                  )}

                  <div className="action-row">
                    <button
                      type="button"
                      onClick={() => saveEdit(p)}
                      className="btn btn-primary px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingId !== null}
                    >
                      {savingId === p.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-muted px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingId !== null}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className="project-card-button"
                    disabled={isRowBusy}
                  >
                    <span
                      className={`project-status-pill project-status-${projectState.replace(" ", "-")}`}
                    >
                      {projectState}
                    </span>
                    <h3>{p.name}</h3>
                    <p>{p.description || "Workspace planning and delivery"}</p>
                    <div className="progress-row">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        className={
                          projectState === "critical"
                            ? "progress-fill progress-fill-alert"
                            : "progress-fill"
                        }
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>

                  <div className="card-action-row">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(p);
                      }}
                      className="btn btn-warning px-4 py-2 text-sm disabled:opacity-60"
                      disabled={isAnyProjectActionBusy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p);
                      }}
                      className="btn btn-danger px-4 py-2 text-sm disabled:opacity-60"
                      disabled={isAnyProjectActionBusy}
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(p.id);
                      }}
                      className="btn btn-muted px-4 py-2 text-sm disabled:opacity-60"
                      disabled={isAnyProjectActionBusy}
                    >
                      Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!loading && projects.length === 0 && (
        <div className="empty-dashboard-state">
          <p>No projects yet.</p>
          <span>Create your first project below to start organizing tasks.</span>
        </div>
      )}

      <form onSubmit={submit} className="quick-create-form">
        <input
          className="app-input"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
          required
        />
        {formErrors?.name?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}
        <textarea
          className="app-textarea"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
        />
        {formErrors?.description?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <button className="btn btn-primary disabled:opacity-60" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </form>

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
