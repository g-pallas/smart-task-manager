import { useState } from "react";

export default function ProjectsPanel({
  projects,
  selectedProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  loading,
  error,
  formErrors,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleEdit = async (project) => {
    if (editingId !== null || deletingId !== null) return;
    const nextName = window.prompt("Project name:", project.name);
    if (nextName === null) return;

    const nextDescription = window.prompt(
      "Project description:",
      project.description ?? "",
    );
    if (nextDescription === null) return;

    const trimmedName = nextName.trim();
    if (!trimmedName) return;

    setEditingId(project.id);
    try {
      await onUpdateProject(project.id, {
        name: trimmedName,
        description: nextDescription.trim(),
      });
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (project) => {
    if (editingId !== null || deletingId !== null) return;
    const ok = window.confirm(`Delete project "${project.name}"?`);
    if (!ok) return;
    setDeletingId(project.id);
    try {
      await onDeleteProject(project.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Projects</h2>

      {loading && (
        <p className="mb-2 text-sm text-slate-500">Loading projects...</p>
      )}
      {error && (
        <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mb-4 rounded bg-white p-4 shadow">
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
          required
        />
        {formErrors?.name?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}
        <textarea
          className="mb-2 w-full rounded border p-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
        />
        {formErrors?.description?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <button
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </form>

      <div className="space-y-3">
        {projects.map((p) => {
          const isRowBusy = editingId === p.id || deletingId === p.id;
          const isAnyProjectActionBusy =
            editingId !== null || deletingId !== null || isCreating;

          return (
            <div
              key={p.id}
              className={`rounded p-4 shadow ${
                selectedProject?.id === p.id
                  ? "bg-blue-50 ring-2 ring-blue-400"
                  : "bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectProject(p)}
                className="mb-2 w-full text-left"
                disabled={isRowBusy}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-600">{p.description}</p>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(p);
                  }}
                  className="rounded bg-amber-500 px-3 py-1 text-sm text-white disabled:opacity-60"
                  disabled={isAnyProjectActionBusy}
                >
                  {editingId === p.id ? "Editing..." : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p);
                  }}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-60"
                  disabled={isAnyProjectActionBusy}
                >
                  {deletingId === p.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
