import { useState } from "react";

const STATUS_OPTIONS = ["todo", "in_progress", "done"];

export default function TasksPanel({
  selectedProject,
  tasks,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
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

  if (!selectedProject) {
    return (
      <section>
        <h2 className="mb-3 text-xl font-semibold">Select a project</h2>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">
        Tasks: {selectedProject.name}
      </h2>
      {loading && (
        <p className="mb-2 text-sm text-slate-500">Loading tasks...</p>
      )}
      {error && (
        <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submitTask} className="mb-4 rounded bg-white p-4 shadow">
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isCreatingTask}
          required
        />
        {formErrors?.title?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.title[0]}</p>
        )}
        <textarea
          className="mb-2 w-full rounded border p-2"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreatingTask}
        />
        {formErrors?.description?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            type="date"
            className="rounded border p-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isCreatingTask}
          />
          {formErrors?.due_date?.[0] && (
            <p className="text-sm text-red-600">{formErrors.due_date[0]}</p>
          )}
          <select
            className="rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isCreatingTask}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {formErrors?.status?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.status[0]}</p>
        )}
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={isCreatingTask}
        >
          {isCreatingTask ? "Adding..." : "Add Task"}
        </button>
      </form>

      <form
        onSubmit={applyFilters}
        className="mb-4 rounded bg-white p-4 shadow"
      >
        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded border p-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={isFiltering}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="rounded border p-2"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isFiltering}
          />
        </div>
        <button
          className="mt-2 rounded bg-slate-700 px-4 py-2 text-white disabled:opacity-60"
          disabled={isFiltering}
        >
          {isFiltering ? "Applying..." : "Apply Filters"}
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="rounded bg-white p-3 shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full">
                {editingTaskId === t.id ? (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded border p-2"
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
                      className="w-full rounded border p-2"
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
                      className="rounded border p-2"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                    {editFormErrors?.due_date?.[0] && (
                      <p className="text-sm text-red-600">
                        {editFormErrors.due_date[0]}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(t.id)}
                        className="rounded bg-emerald-600 px-2 py-1 text-sm text-white disabled:opacity-60"
                        disabled={savingTaskId !== null}
                      >
                        {savingTaskId === t.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded bg-slate-500 px-2 py-1 text-sm text-white disabled:opacity-60"
                        disabled={savingTaskId !== null}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold">{t.title}</h4>
                    <p className="text-sm text-slate-600">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      Due:{" "}
                      {t.due_date ? String(t.due_date).slice(0, 10) : "N/A"}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded border p-1 text-sm"
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
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {editingTaskId !== t.id && (
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className="rounded bg-amber-500 px-2 py-1 text-sm text-white disabled:opacity-60"
                    disabled={
                      statusUpdatingTaskId !== null ||
                      deletingTaskId !== null ||
                      savingTaskId !== null
                    }
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setDeletingTaskId(t.id);
                    try {
                      await onDeleteTask(t.id, buildParams(safeCurrentPage));
                    } finally {
                      setDeletingTaskId(null);
                    }
                  }}
                  className="rounded bg-red-600 px-2 py-1 text-sm text-white disabled:opacity-60"
                  disabled={
                    statusUpdatingTaskId !== null ||
                    deletingTaskId !== null ||
                    savingTaskId !== null
                  }
                >
                  {deletingTaskId === t.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded bg-white p-3 shadow">
        <p className="text-sm text-slate-600">
          Showing {pagination?.from ?? 0}-{pagination?.to ?? 0} of{" "}
          {pagination?.total ?? 0}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded bg-slate-200 px-3 py-1 text-sm disabled:opacity-50"
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
            className="rounded bg-slate-200 px-3 py-1 text-sm disabled:opacity-50"
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
    </section>
  );
}
