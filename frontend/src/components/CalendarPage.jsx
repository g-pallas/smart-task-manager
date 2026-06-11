import { useMemo, useState } from "react";
import FaqButton from "./FaqButton";
import NotificationBell from "./NotificationBell";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, amount) => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const startOfWeek = (value) => addDays(startOfDay(value), -value.getDay());

const sameDay = (value, date) => {
  if (!value) return false;
  return startOfDay(value).getTime() === startOfDay(date).getTime();
};

const buildMonthDays = (anchorDate) => {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const start = addDays(first, -first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      muted: date.getMonth() !== anchorDate.getMonth(),
      active: sameDay(date, new Date()),
    };
  });
};

const formatHeader = (date, view) => {
  if (view === "day") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    const startLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(start);
    const endLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(end);
    return `${startLabel} - ${endLabel}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const taskDateLabel = (value) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export default function CalendarPage({
  items = [],
  currentUser,
  onSearch,
  notificationProps,
  onOpenFaq,
}) {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [search, setSearch] = useState("");

  const tasks = useMemo(
    () => items.filter((item) => item.type === "task" && item.starts_at),
    [items],
  );
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((item) =>
      `${item.title ?? ""} ${item.description ?? ""} ${item.project_name ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [tasks, search]);

  const visibleDays = useMemo(() => {
    if (view === "day") {
      return [{ date: startOfDay(anchorDate), muted: false, active: sameDay(anchorDate, new Date()) }];
    }
    if (view === "week") {
      const start = startOfWeek(anchorDate);
      return Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index);
        return { date, muted: false, active: sameDay(date, new Date()) };
      });
    }
    return buildMonthDays(anchorDate);
  }, [anchorDate, view]);

  const priorityTasks = [...filteredTasks]
    .filter((item) => item.status !== "done" && startOfDay(item.starts_at) >= startOfDay(new Date()))
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 3);

  const runSearch = (value) => {
    setSearch(value);
    onSearch?.({ search: value });
  };

  const moveRange = (direction) => {
    if (view === "day") {
      setAnchorDate((current) => addDays(current, direction));
    } else if (view === "week") {
      setAnchorDate((current) => addDays(current, direction * 7));
    } else {
      setAnchorDate(
        (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
      );
    }
  };

  return (
    <section className="calendar-page">
      <header className="calendar-topbar">
        <label className="search-box calendar-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => runSearch(event.target.value)}
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

      <section className="calendar-hero">
        <div>
          <h1>{formatHeader(anchorDate, view)}</h1>
          <p>Tasks appear automatically on their project due dates.</p>
        </div>
        <div className="calendar-controls">
          <div className="calendar-view-toggle" aria-label="Calendar view">
            {["day", "week", "month"].map((option) => (
              <button
                className={view === option ? "active" : ""}
                type="button"
                onClick={() => setView(option)}
                key={option}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="calendar-nav-button"
            type="button"
            aria-label={`Previous ${view}`}
            onClick={() => moveRange(-1)}
          >
            ‹
          </button>
          <button
            className="calendar-nav-button"
            type="button"
            aria-label={`Next ${view}`}
            onClick={() => moveRange(1)}
          >
            ›
          </button>
        </div>
      </section>

      <section className={`calendar-grid-card calendar-grid-${view}`}>
        {view !== "day" && (
          <div className="calendar-weekdays">
            {visibleDays.slice(0, 7).map(({ date }) => (
              <span key={date.toISOString()}>{WEEKDAYS[date.getDay()]}</span>
            ))}
          </div>
        )}
        <div className={`calendar-month-grid calendar-range-${view}`}>
          {visibleDays.map(({ date: day, muted, active }) => {
            const dayTasks = filteredTasks.filter((item) => sameDay(item.starts_at, day));
            return (
              <div className={`calendar-day ${muted ? "calendar-day-muted" : ""} ${active ? "calendar-day-active" : ""}`} key={day.toISOString()}>
                <div className="calendar-date-heading">
                  <span className="calendar-date-number">{day.getDate()}</span>
                  {view === "day" && <strong>{taskDateLabel(day)}</strong>}
                </div>
                {active && <span className="calendar-pin" />}
                <div className="calendar-event-list">
                  {dayTasks.map((task) => (
                    <div
                      className={`calendar-event calendar-event-${task.status === "done" ? "soft" : "danger"}`}
                      key={`task-${task.id}`}
                      title={`${task.title}${task.project_name ? ` - ${task.project_name}` : ""}`}
                    >
                      <strong>{task.title}</strong>
                      {view !== "month" && (
                        <span>{task.project_name || "Project task"}</span>
                      )}
                    </div>
                  ))}
                  {!dayTasks.length && view === "day" && (
                    <div className="calendar-day-empty">No tasks due on this day.</div>
                  )}
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
                <p>{task.description || taskDateLabel(task.starts_at)} • Project: {task.project_name || "Personal Manager"}</p>
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
            You have <strong>{priorityTasks.length} upcoming deadlines</strong>{" "}
            in this calendar.
          </p>
        </aside>
      </div>
    </section>
  );
}
