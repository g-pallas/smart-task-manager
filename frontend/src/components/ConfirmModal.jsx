export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmClassName =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-slate-800 hover:bg-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
          >
            {cancelLabel}
          </button> 
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded px-4 py-2 text-sm text-white disabled:opacity-60 ${confirmClassName}`}
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
