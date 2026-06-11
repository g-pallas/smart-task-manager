import { useEffect, useRef, useState } from "react";

const formatDueLabel = (task) => {
  if (task.is_overdue) {
    return `Overdue since ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(`${task.due_date}T00:00:00`))}`;
  }
  return "Due today";
};

export default function NotificationBell({
  tasks = [],
  desktopEnabled = false,
  onOpenTask,
  onEnableDesktop,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        className={`icon-button ${tasks.length ? "notification-dot" : ""}`}
        type="button"
        aria-label={`Notifications${tasks.length ? ` (${tasks.length} urgent)` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </button>

      {open && (
        <section className="notification-menu" aria-label="Task alerts">
          <header>
            <div>
              <strong>Task Alerts</strong>
              <span>{tasks.length} due or overdue</span>
            </div>
            {!desktopEnabled && (
              <button type="button" onClick={onEnableDesktop}>
                Enable desktop alerts
              </button>
            )}
          </header>

          <div className="notification-list">
            {tasks.map((task) => (
              <button
                className={`notification-item ${task.is_overdue ? "notification-item-critical" : ""}`}
                type="button"
                key={task.id}
                onClick={() => {
                  setOpen(false);
                  onOpenTask?.(task);
                }}
              >
                <span className="notification-severity">
                  {task.is_overdue ? "Critical" : "Due today"}
                </span>
                <strong>{task.title}</strong>
                <small>{task.project_name || "Project"} • {formatDueLabel(task)}</small>
              </button>
            ))}
            {!tasks.length && (
              <div className="notification-empty">
                <strong>You are caught up.</strong>
                <span>No tasks are due or overdue.</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
