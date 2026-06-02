import { useMemo, useState } from "react";

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
  onSearch,
}) {
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.title ?? ""} ${item.description ?? ""} ${item.category ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [items, search]);
  const projectCount = items.filter((item) => item.type === "project").length;
  const taskCount = items.filter((item) => item.type === "task").length;

  const runSearch = (value) => {
    setSearch(value);
    onSearch?.({ search: value });
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
            onChange={(e) => runSearch(e.target.value)}
          />
        </label>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Notifications">
            <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
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
          <span>Total Archived Size</span>
          <strong>{items.length} <small>items</small></strong>
          <div className="archive-usage-track"><i style={{ width: `${Math.min(items.length * 12, 100)}%` }} /></div>
        </article>
        <article className="archive-stat-card">
          <span>Automatic Purge</span>
          <strong>Off <em>Manual</em></strong>
          <p>Archived items are preserved until restored or moved to trash.</p>
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
          <button type="button">Filter By Category⌄</button>
        </div>

        <div className="archive-list">
          {filteredItems.map((item) => (
            <article className={`archive-item archive-item-${item.type === "project" ? "indigo" : "danger"}`} key={`${item.type}-${item.id}`}>
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
              <button type="button" aria-label={`Restore ${item.title}`} onClick={() => onRestore(item)}>
                <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3v12" />
                  <path d="m7 8 5-5 5 5" />
                  <path d="M5 15v4h14v-4" />
                </svg>
              </button>
            </article>
          ))}
          {!filteredItems.length && (
            <div className="empty-dashboard-state">
              <p>No archived items.</p>
              <span>Archive projects or tasks to see them here.</span>
            </div>
          )}
        </div>
      </section>

      <div className="archive-insight-grid">
        <section className="archive-insight-card">
          <h2>Storage Insights</h2>
          <p>
            Your archive currently contains {projectCount} projects and {taskCount} tasks.
            Restore anything you need back in the active workspace.
          </p>
        </section>

        <section className="archive-integrity-card">
          <span>↺</span>
          <small>Live Data</small>
          <h2>Vault Integrity</h2>
          <p>Archived records remain scoped to your account and can be restored.</p>
          <code>LAST_SYNC: {new Date().toISOString()}</code>
        </section>
      </div>
    </section>
  );
}
