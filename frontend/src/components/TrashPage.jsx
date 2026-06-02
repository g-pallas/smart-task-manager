import { useMemo, useState } from "react";

const daysUntil = (value) => {
  if (!value) return "Expires later";
  const days = Math.max(0, Math.ceil((new Date(value) - new Date()) / 86400000));
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
};

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
}) {
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.title ?? ""} ${item.project_name ?? ""}`.toLowerCase().includes(query),
    );
  }, [items, search]);

  const runSearch = (value) => {
    setSearch(value);
    onSearch?.({ search: value });
  };

  return (
    <section className="trash-page">
      <header className="trash-topbar">
        <div className="trash-title-row">
          <h1>Trash</h1>
          <span>System Maintenance</span>
        </div>
        <label className="search-box trash-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search deleted items..."
            value={search}
            onChange={(e) => runSearch(e.target.value)}
          />
        </label>
        <button className="icon-button notification-dot" type="button" aria-label="Notifications">
          <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </button>
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
            <h2>Storage Reclaim</h2>
            <p>
              Emptying your trash will permanently delete <strong>{items.length} items</strong>.
              Restore anything you want to keep before emptying it.
            </p>
          </div>
        </div>
        <button className="trash-empty-button" type="button" onClick={onEmptyTrash} disabled={!items.length}>
          Empty Trash
        </button>
      </section>

      <section className="trash-visual-panel" aria-label="Deleted item preview">
        <div className="trash-blur-card trash-blur-card-one" />
        <div className="trash-blur-card trash-blur-card-two" />
        <div className="trash-blur-card trash-blur-card-three" />
      </section>

      <section className="trash-list">
        {filteredItems.map((item) => (
          <article className="trash-item" key={`${item.type}-${item.id}`}>
            <span className="trash-item-icon">
              <TrashIcon type={item.type} />
            </span>
            <div>
              <h2>{item.type === "project" ? "Project: " : "Task: "}{item.title}</h2>
              <p>
                <span>{deletedLabel(item.deleted_at)}</span>
                <i />
                <strong>{daysUntil(item.expires_at)}</strong>
              </p>
            </div>
            <div className="trash-item-actions">
              <button type="button" onClick={() => onRestore(item)}>Restore</button>
              <button type="button" onClick={() => onPermanentDelete(item)}>Delete Forever</button>
            </div>
          </article>
        ))}
        {!filteredItems.length && (
          <div className="empty-dashboard-state">
            <p>Trash is empty.</p>
            <span>Deleted projects and tasks will appear here first.</span>
          </div>
        )}
      </section>

      <div className="trash-load-row">
        <button type="button">Showing {filteredItems.length} items</button>
      </div>
    </section>
  );
}
