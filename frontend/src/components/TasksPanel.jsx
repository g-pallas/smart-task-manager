import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const formatDueDate = (value) => {
  if (!value) return "N/A";

  const normalized = String(value).slice(0, 10);
  const parsedDate = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const formatTaskTime = (task, index) => {
  if (!task?.due_date) return ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"][index % 4];

  const parsedDate = new Date(task.due_date);
  if (Number.isNaN(parsedDate.getTime())) {
    return ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"][index % 4];
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const getTaskTone = (status, index) => {
  if (status === "done") return "routine";
  if (status === "in_progress") return "inprogress";
  return index < 2 ? "important" : "routine";
};

export default function TasksPanel({
  selectedProject,
  tasks,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onArchiveTask,
  onLoadTasks,
  loading,
  error,
  pagination,
  onUpdateTask,
  formErrors,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("todo");

  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title ?? "");
    setEditDescription(task.description ?? "");
    setEditDueDate(task.due_date ? String(task.due_date).slice(0, 10) : "");
    setEditFormErrors({});
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditFormErrors({});
  };

  const saveEdit = async (taskId) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || savingTaskId !== null) return;

    setEditFormErrors({});
    setSavingTaskId(taskId);
    try {
      const result = await onUpdateTask(
        taskId,
        {
          title: trimmedTitle,
          description: editDescription.trim() || null,
          due_date: editDueDate || null,
        },
        buildParams(safeCurrentPage),
      );
      if (result?.ok) {
        cancelEdit();
      } else {
        setEditFormErrors(result?.fieldErrors ?? {});
      }
    } finally {
      setSavingTaskId(null);
    }
  };

  const buildParams = (page = 1) => {
    const params = { page };
    if (filterStatus) params.status = filterStatus;
    if (search.trim()) params.search = search.trim();
    return params;
  };

  const safeCurrentPage = Math.min(
    pagination?.currentPage ?? 1,
    pagination?.lastPage ?? 1,
  );

  const submitTask = async (e) => {
    e.preventDefault();
    if (isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      const ok = await onCreateTask(
        {
          title,
          description: description || null,
          due_date: dueDate || null,
          status,
        },
        buildParams(safeCurrentPage),
      );
      if (ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setStatus("todo");
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    if (!selectedProject || isFiltering) return;

    setIsFiltering(true);
    try {
      await onLoadTasks(selectedProject.id, buildParams(1));
    } finally {
      setIsFiltering(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeletingTaskId(taskToDelete.id);
    try {
      await onDeleteTask(taskToDelete.id, buildParams(safeCurrentPage));
      setTaskToDelete(null);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (!selectedProject) {
    return (
      <section className="today-panel">
        <div className="section-heading-row">
          <h2>Today&apos;s Tasks</h2>
          <button className="dots-button" type="button" aria-label="More task options">
            ...
          </button>
        </div>
        <div className="empty-dashboard-state">
          <p>Choose a project to begin.</p>
          <span>Your task list appears here once a project is selected.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="today-panel">
      <div className="section-heading-row">
        <h2>Today&apos;s Tasks</h2>
        <button className="dots-button" type="button" aria-label="More task options">
          ...
        </button>
      </div>
      {loading && (
        <p className="inline-status">Loading tasks...</p>
      )}
      {error && (
        <p className="dashboard-error">{error}</p>
      )}

      <div className="today-task-list">
        {tasks.map((t, index) => {
          const tone = getTaskTone(t.status, index);

          return (
            <div key={t.id} className={`today-task today-task-${tone}`}>
              <div className="today-task-topline">
                <span>{tone === "inprogress" ? "In Progress" : tone}</span>
                <time>{formatTaskTime(t, index)}</time>
              </div>

              {editingTaskId === t.id ? (
                <div className="edit-stack">
                  <input
                    className="app-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                  />
                  {editFormErrors?.title?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.title[0]}
                    </p>
                  )}
                  <textarea
                    className="app-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Task description"
                  />
                  {editFormErrors?.description?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.description[0]}
                    </p>
                  )}
                  <input
                    type="date"
                    className="app-input"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                  {editFormErrors?.due_date?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.due_date[0]}
                    </p>
                  )}
                  <div className="action-row">
                    <button
                      type="button"
                      onClick={() => saveEdit(t.id)}
                      className="btn btn-primary px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingTaskId !== null}
                    >
                      {savingTaskId === t.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-muted px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingTaskId !== null}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{t.title}</h3>
                  <label className="task-check-row">
                    <input
                      type="checkbox"
                      checked={t.status === "done"}
                      disabled={
                        statusUpdatingTaskId !== null ||
                        deletingTaskId !== null ||
                        savingTaskId !== null
                      }
                      onChange={async (e) => {
                        setStatusUpdatingTaskId(t.id);
                        try {
                          await onUpdateTaskStatus(
                            t.id,
                            e.target.checked ? "done" : "todo",
                            buildParams(safeCurrentPage),
                          );
                        } finally {
                          setStatusUpdatingTaskId(null);
                        }
                      }}
                    />
                    <span>{t.description || formatDueDate(t.due_date)}</span>
                  </label>
                  <div className="task-mini-actions">
                    <select
                      className="app-select"
                      value={t.status}
                      disabled={
                        statusUpdatingTaskId !== null ||
                        deletingTaskId !== null ||
                        savingTaskId !== null
                      }
                      onChange={async (e) => {
                        setStatusUpdatingTaskId(t.id);
                        try {
                          await onUpdateTaskStatus(
                            t.id,
                            e.target.value,
                            buildParams(safeCurrentPage),
                          );
                        } finally {
                          setStatusUpdatingTaskId(null);
                        }
                      }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="text-link"
                      disabled={
                        statusUpdatingTaskId !== null ||
                        deletingTaskId !== null ||
                        savingTaskId !== null
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(t)}
                      className="text-link text-link-danger"
                      disabled={
                        statusUpdatingTaskId !== null ||
                        deletingTaskId !== null ||
                        savingTaskId !== null
                      }
                    >
                      {deletingTaskId === t.id ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onArchiveTask(selectedProject.id, t.id, buildParams(safeCurrentPage))}
                      className="text-link"
                      disabled={
                        statusUpdatingTaskId !== null ||
                        deletingTaskId !== null ||
                        savingTaskId !== null
                      }
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

      {!loading && tasks.length === 0 && (
        <div className="empty-dashboard-state">
          <p>No tasks found for this project.</p>
          <span>Add your first task below or adjust the filters.</span>
        </div>
      )}

      <form onSubmit={submitTask} className="quick-create-form task-create-form">
        <input
          className="app-input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isCreatingTask}
          required
        />
        {formErrors?.title?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.title[0]}</p>
        )}
        <textarea
          className="app-textarea"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreatingTask}
        />
        {formErrors?.description?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <div className="form-grid">
          <input
            type="date"
            className="app-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isCreatingTask}
          />
          {formErrors?.due_date?.[0] && (
            <p className="text-sm text-red-600">{formErrors.due_date[0]}</p>
          )}
          <select
            className="app-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isCreatingTask}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {formErrors?.status?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.status[0]}</p>
        )}
        <button
          className="btn btn-secondary disabled:opacity-60"
          disabled={isCreatingTask}
        >
          {isCreatingTask ? "Adding..." : "Add Task"}
        </button>
      </form>

      <form onSubmit={applyFilters} className="filter-strip">
        <div className="form-grid">
          <select
            className="app-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={isFiltering}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="app-input"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isFiltering}
          />
        </div>
        <button
          className="btn btn-dark disabled:opacity-60"
          disabled={isFiltering}
        >
          {isFiltering ? "Applying..." : "Apply Filters"}
        </button>
      </form>

      <div className="pagination-strip">
        <p className="text-sm text-slate-600">
          Showing {pagination?.from ?? 0}-{pagination?.to ?? 0} of{" "}
          {pagination?.total ?? 0}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-muted px-4 py-2 text-sm disabled:opacity-50"
            disabled={safeCurrentPage <= 1 || isPaginating}
            onClick={async () => {
              setIsPaginating(true);
              try {
                await onLoadTasks(
                  selectedProject.id,
                  buildParams(safeCurrentPage - 1),
                );
              } finally {
                setIsPaginating(false);
              }
            }}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {safeCurrentPage} / {pagination?.lastPage ?? 1}
          </span>
          <button
            type="button"
            className="btn btn-muted px-4 py-2 text-sm disabled:opacity-50"
            disabled={
              safeCurrentPage >= (pagination?.lastPage ?? 1) || isPaginating
            }
            onClick={async () => {
              setIsPaginating(true);
              try {
                await onLoadTasks(
                  selectedProject.id,
                  buildParams(safeCurrentPage + 1),
                );
              } finally {
                setIsPaginating(false);
              }
            }}
          >
            Next
          </button>
        </div>
      </div>

      {taskToDelete && (
        <ConfirmModal
          title="Delete task?"
          message={`This will permanently remove "${taskToDelete.title}".`}
          confirmLabel="Delete task"
          busy={deletingTaskId === taskToDelete.id}
          onCancel={() => {
            if (deletingTaskId === null) setTaskToDelete(null);
          }}
          onConfirm={confirmDeleteTask}
        />
      )}
    </section>
  );
}
