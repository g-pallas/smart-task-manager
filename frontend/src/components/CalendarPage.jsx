import { useMemo, useState } from "react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const toDateInput = (date) => date.toISOString().slice(0, 10);

const monthLabel = (date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);

const sameDay = (value, date) => {
  if (!value) return false;
  const parsed = new Date(value);
  return parsed.toDateString() === date.toDateString();
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      muted: date.getMonth() !== month,
      active: date.toDateString() === new Date().toDateString(),
    };
  });
};

export default function CalendarPage({
  items = [],
  projects = [],
  currentUser,
  onCreateEvent,
  onDeleteEvent,
  onSearch,
}) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.title ?? ""} ${item.description ?? ""} ${item.project_name ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [items, search]);

  const priorityTasks = filteredItems
    .filter((item) => item.type === "task" && item.status !== "done")
    .slice(0, 3);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      await onCreateEvent({
        title,
        description: description || null,
        starts_at: `${date}T09:00:00`,
        ends_at: null,
        project_id: projectId || null,
        color: "indigo",
      });
      setTitle("");
      setDescription("");
      setProjectId("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const runSearch = (value) => {
    setSearch(value);
    onSearch?.({ search: value });
  };

  return (
    <section className="calendar-page">
      <header className="calendar-topbar">
        <label className="search-box calendar-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search tasks or events..."
            value={search}
            onChange={(e) => runSearch(e.target.value)}
          />
        </label>
        <div className="topbar-actions">
          <button className="icon-button notification-dot" type="button" aria-label="Notifications">
            <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <button className="avatar-button" type="button">
            {(currentUser?.name || currentUser?.email || "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <section className="calendar-hero">
        <div>
          <h1>{monthLabel(monthDate)}</h1>
          <p>Manage your productivity deadlines and scheduled reviews.</p>
        </div>
        <div className="calendar-controls">
          <div className="calendar-view-toggle">
            <button type="button">Day</button>
            <button type="button">Week</button>
            <button className="active" type="button">Month</button>
          </div>
          <button
            className="calendar-nav-button"
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <button
            className="calendar-nav-button"
            type="button"
            aria-label="Next month"
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
          >
            ›
          </button>
          <button className="btn btn-secondary calendar-event-button" type="button" onClick={() => setShowForm(true)}>
            + New Event
          </button>
        </div>
      </section>

      {showForm && (
        <form className="project-create-card calendar-create-card" onSubmit={submit}>
          <input className="app-input" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="app-textarea" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="form-grid">
            <input className="app-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <select className="app-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option value={project.id} key={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="action-row">
            <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Create Event"}</button>
            <button className="btn btn-muted" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <section className="calendar-grid-card">
        <div className="calendar-weekdays">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-month-grid">
          {calendarDays.map(({ date: day, muted, active }) => {
            const dayItems = filteredItems.filter((item) => sameDay(item.starts_at, day));
            return (
              <div className={`calendar-day ${muted ? "calendar-day-muted" : ""} ${active ? "calendar-day-active" : ""}`} key={day.toISOString()}>
                <span className="calendar-date-number">{day.getDate()}</span>
                {active && <span className="calendar-pin" />}
                <div className="calendar-event-list">
                  {dayItems.map((item) => (
                    <button
                      className={`calendar-event calendar-event-${item.type === "task" ? "danger" : "soft"}`}
                      type="button"
                      key={`${item.type}-${item.id}`}
                      onClick={() => item.type === "event" && onDeleteEvent(item.id)}
                      title={item.type === "event" ? "Click to delete event" : item.title}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="calendar-lower-grid">
        <section className="priority-section">
          <h2>Upcoming Priority Tasks</h2>
          <div className="priority-list">
            {priorityTasks.length ? priorityTasks.map((task, index) => (
              <article className={`priority-card ${index === 0 ? "priority-card-high" : "priority-card-normal"}`} key={task.id}>
                <span>{index === 0 ? "High Priority" : "Scheduled"}</span>
                <h3>{task.title}</h3>
                <p>{task.description || "Due soon"} • Project: {task.project_name || "Personal Manager"}</p>
                <strong>!</strong>
              </article>
            )) : (
              <div className="empty-dashboard-state">
                <p>No upcoming priority tasks.</p>
                <span>Add task due dates to see them here.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="workspace-insight-card">
          <div className="insight-orb">⌁</div>
          <h2>Workspace Insight</h2>
          <p>
            You have <strong>{priorityTasks.length} critical deadlines</strong>{" "}
            approaching in this calendar view.
          </p>
        </aside>
      </div>
    </section>
  );
}
