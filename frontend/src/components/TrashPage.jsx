import { useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import FaqButton from "./FaqButton";
import NotificationBell from "./NotificationBell";

const deletedLabel = (value) => {
  if (!value) return "Deleted recently";
  return `Deleted on ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value))}`;
};

const TrashIcon = ({ type }) => (
  <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    {type === "project" ? (
      <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ) : (
      <>
        <path d="M4 5h16v12H7l-3 3Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    )}
  </svg>
);

export default function TrashPage({
  items = [],
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onSearch,
  notificationProps,
  onOpenFaq,
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesSearch =
        !query ||
        `${item.title ?? ""} ${item.project_name ?? ""}`.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [items, search, type]);

  const load = (nextSearch, nextType) => {
    onSearch?.({
      search: nextSearch || undefined,
      type: nextType === "all" ? undefined : nextType,
    });
  };

  const restore = async (item) => {
    const key = `${item.type}-${item.id}`;
    setBusyKey(key);
    setError("");
    try {
      await onRestore(item);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to restore the item.");
    } finally {
      setBusyKey("");
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const key = pendingAction.kind === "empty"
      ? "empty"
      : `${pendingAction.item.type}-${pendingAction.item.id}`;
    setBusyKey(key);
    setError("");
    try {
      if (pendingAction.kind === "empty") {
        await onEmptyTrash();
      } else {
        await onPermanentDelete(pendingAction.item);
      }
      setPendingAction(null);
    } catch (err) {
      setError(err?.response?.data?.message || "The trash operation failed.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <section className="trash-page">
      <header className="trash-topbar">
        <div className="trash-title-row">
          <h1>Trash</h1>
          <span>{items.length} deleted {items.length === 1 ? "item" : "items"}</span>
        </div>
        <div className="trash-toolbar">
          <label className="search-box trash-search-box">
            <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
            <input
              placeholder="Search deleted items..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                load(event.target.value, type);
              }}
            />
          </label>
          <select
            className="app-select repository-filter"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              load(search, event.target.value);
            }}
            aria-label="Filter trash by category"
          >
            <option value="all">All items</option>
            <option value="project">Projects</option>
            <option value="task">Tasks</option>
          </select>
          <NotificationBell {...notificationProps} />
          <FaqButton onClick={onOpenFaq} />
        </div>
      </header>

      <section className="trash-reclaim-card">
        <div className="trash-reclaim-copy">
          <span className="trash-reclaim-icon">
            <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v5M14 11v5" />
            </svg>
          </span>
          <div>
            <h2>Permanent Deletion</h2>
            <p>
              Emptying Trash will permanently delete <strong>{items.length} items</strong>.
              Restore anything you want to keep first.
            </p>
          </div>
        </div>
        <button
          className="trash-empty-button"
          type="button"
          onClick={() => setPendingAction({ kind: "empty" })}
          disabled={!items.length || Boolean(busyKey)}
        >
          Empty Trash
        </button>
      </section>

      {error && <p className="dashboard-error">{error}</p>}
      <section className="trash-list">
        {filteredItems.map((item) => {
          const key = `${item.type}-${item.id}`;
          const busy = busyKey === key;
          return (
            <article className="trash-item" key={key}>
              <span className="trash-item-icon">
                <TrashIcon type={item.type} />
              </span>
              <div className="trash-item-copy">
                <h2>{item.type === "project" ? "Project: " : "Task: "}{item.title}</h2>
                <p>{deletedLabel(item.deleted_at)}</p>
              </div>
              <div className="trash-item-actions">
                <button type="button" disabled={Boolean(busyKey)} onClick={() => restore(item)}>
                  {busy ? "Working..." : "Restore"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busyKey)}
                  onClick={() => setPendingAction({ kind: "delete", item })}
                >
                  Delete Forever
                </button>
              </div>
            </article>
          );
        })}
        {!filteredItems.length && (
          <div className="empty-dashboard-state">
            <p>Trash is empty.</p>
            <span>Deleted projects and tasks will appear here.</span>
          </div>
        )}
      </section>

      <div className="trash-load-row">
        <span>Showing {filteredItems.length} items</span>
      </div>

      {pendingAction && (
        <ConfirmModal
          title={pendingAction.kind === "empty" ? "Empty trash?" : "Delete forever?"}
          message={
            pendingAction.kind === "empty"
              ? `Permanently delete all ${items.length} items in Trash?`
              : `Permanently delete "${pendingAction.item.title}"? This cannot be undone.`
          }
          confirmLabel={pendingAction.kind === "empty" ? "Empty Trash" : "Delete Forever"}
          busy={Boolean(busyKey)}
          onCancel={() => {
            if (!busyKey) setPendingAction(null);
          }}
          onConfirm={confirmAction}
        />
      )}
    </section>
  );
}
