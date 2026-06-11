import { useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import FaqButton from "./FaqButton";
import NotificationBell from "./NotificationBell";

const formatDate = (value) => {
  if (!value) return "Recently archived";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export default function ArchivePage({
  currentUser,
  items = [],
  onRestore,
  onMoveToTrash,
  onSearch,
  notificationProps,
  onOpenFaq,
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [itemToTrash, setItemToTrash] = useState(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesSearch =
        !query ||
        `${item.title ?? ""} ${item.description ?? ""} ${item.category ?? ""}`
          .toLowerCase()
          .includes(query);
      return matchesType && matchesSearch;
    });
  }, [items, search, type]);
  const projectCount = items.filter((item) => item.type === "project").length;
  const taskCount = items.filter((item) => item.type === "task").length;

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
      setError(err?.response?.data?.message || "Failed to restore the archived item.");
    } finally {
      setBusyKey("");
    }
  };

  const confirmMoveToTrash = async () => {
    if (!itemToTrash) return;
    const key = `${itemToTrash.type}-${itemToTrash.id}`;
    setBusyKey(key);
    setError("");
    try {
      await onMoveToTrash(itemToTrash);
      setItemToTrash(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to move the archived item to trash.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <section className="archive-page">
      <header className="archive-topbar">
        <div className="archive-wordmark">Archive Workspace</div>
        <label className="search-box archive-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search archive..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              load(event.target.value, type);
            }}
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

      <section className="archive-heading">
        <h1>Archive Repository</h1>
      </section>

      <section className="archive-stats">
        <article className="archive-stat-card">
          <span>Archived Items</span>
          <strong>{items.length} <small>items</small></strong>
          <div className="archive-usage-track"><i style={{ width: `${Math.min(items.length * 12, 100)}%` }} /></div>
        </article>
        <article className="archive-stat-card">
          <span>Retention</span>
          <strong>Manual</strong>
          <p>Archived items stay here until you restore them or move them to trash.</p>
        </article>
        <article className="archive-stat-card">
          <span>Archived Objects</span>
          <strong>{items.length} <small>items total</small></strong>
          <div className="archive-tags">
            <i>{projectCount} Projects</i>
            <i>{taskCount} Tasks</i>
          </div>
        </article>
      </section>

      <section className="archive-list-section">
        <div className="archive-section-row">
          <h2>Recent Deposits</h2>
          <select
            className="app-select repository-filter"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              load(search, event.target.value);
            }}
            aria-label="Filter archive by category"
          >
            <option value="all">All items</option>
            <option value="project">Projects</option>
            <option value="task">Tasks</option>
          </select>
        </div>

        {error && <p className="dashboard-error">{error}</p>}
        <div className="archive-list">
          {filteredItems.map((item) => {
            const key = `${item.type}-${item.id}`;
            const busy = busyKey === key;
            return (
              <article className={`archive-item archive-item-${item.type === "project" ? "indigo" : "danger"}`} key={key}>
                <span className="archive-item-icon">
                  <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={item.type === "project" ? "M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" : "M4 4h16v16H4Z"} />
                    {item.type === "task" && <path d="M8 12h8M12 8v8" />}
                  </svg>
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>Archived on {formatDate(item.archived_at)} • {item.category}</p>
                </div>
                <strong>{item.size_label}</strong>
                <em>{item.type}</em>
                <div className="archive-item-actions">
                  <button type="button" disabled={Boolean(busyKey)} onClick={() => restore(item)}>
                    {busy ? "Working..." : "Restore"}
                  </button>
                  <button type="button" disabled={Boolean(busyKey)} onClick={() => setItemToTrash(item)}>
                    Move to Trash
                  </button>
                </div>
              </article>
            );
          })}
          {!filteredItems.length && (
            <div className="empty-dashboard-state">
              <p>No archived items found.</p>
              <span>Archive projects or tasks, or adjust the current filters.</span>
            </div>
          )}
        </div>
      </section>

      <section className="archive-insight-card">
        <h2>Storage Insights</h2>
        <p>
          Your archive currently contains {projectCount} projects and {taskCount} tasks.
          Every item is scoped to your account and can be restored.
        </p>
      </section>

      {itemToTrash && (
        <ConfirmModal
          title="Move to trash?"
          message={`Move "${itemToTrash.title}" from Archive to Trash?`}
          confirmLabel="Move to Trash"
          busy={busyKey === `${itemToTrash.type}-${itemToTrash.id}`}
          onCancel={() => {
            if (!busyKey) setItemToTrash(null);
          }}
          onConfirm={confirmMoveToTrash}
        />
      )}
    </section>
  );
}
