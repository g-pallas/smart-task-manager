import { useMemo, useState } from "react";
import FaqButton from "./FaqButton";
import NotificationBell from "./NotificationBell";

const FAQ_GROUPS = [
  {
    title: "Projects and Tasks",
    items: [
      {
        question: "How do I create a project?",
        answer:
          "Select New Project from the sidebar. The Projects page opens with the project form focused so you can enter a name and description.",
      },
      {
        question: "How do I add a task to a project?",
        answer:
          "Open a project from the Dashboard or Projects page, then use the Tasks form to add a title, description, due date, and status.",
      },
      {
        question: "How do I make a project my priority?",
        answer:
          "Use Set Priority on a project card. Your personal priority is shown on the Dashboard and Projects page and can be opened from Workspace Priority.",
      },
      {
        question: "What happens when I mark a task as done?",
        answer:
          "The task is counted in your completion statistics and its completion time is recorded. You can reopen it by changing its status.",
      },
    ],
  },
  {
    title: "Calendar and Notifications",
    items: [
      {
        question: "How do tasks appear on the calendar?",
        answer:
          "Tasks with due dates appear automatically. Use Day, Week, or Month to change the calendar range; separate calendar events are not required.",
      },
      {
        question: "Which tasks create alerts?",
        answer:
          "The notification center shows incomplete tasks that are due today or overdue. The red dot appears only when an alert needs your attention.",
      },
      {
        question: "How do I enable desktop notifications?",
        answer:
          "Open the notification bell and select Enable desktop alerts, or turn on Desktop Notifications in Settings. Your browser must grant permission.",
      },
      {
        question: "Why did I receive only one desktop alert?",
        answer:
          "Desktop alerts are deduplicated per task each day to avoid repeated notifications whenever the app regains focus.",
      },
    ],
  },
  {
    title: "Archive and Trash",
    items: [
      {
        question: "What is the difference between Archive and Trash?",
        answer:
          "Archive hides an item while preserving it for later use. Trash contains deleted items that can be restored or permanently deleted.",
      },
      {
        question: "How do I restore an archived item?",
        answer:
          "Open Archive, find the project or task, and select Restore. You can filter the page by projects or tasks.",
      },
      {
        question: "Can I move an archived item to Trash?",
        answer:
          "Yes. Select Move to Trash on the archived item and confirm the action.",
      },
      {
        question: "Can permanent deletion be undone?",
        answer:
          "No. Delete Forever and Empty Trash permanently remove data after confirmation.",
      },
    ],
  },
  {
    title: "Account and Appearance",
    items: [
      {
        question: "How is light or dark mode selected?",
        answer:
          "The application follows your device theme automatically and updates when the device theme changes.",
      },
      {
        question: "How do I update my name, email, or password?",
        answer:
          "Open Settings and use the Profile or Password sections. Changes are saved to your account.",
      },
    ],
  },
];

export default function FaqPage({
  currentUser,
  notificationProps,
  onOpenFaq,
}) {
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState("");

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return FAQ_GROUPS;

    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        `${item.question} ${item.answer}`.toLowerCase().includes(query),
      ),
    })).filter((group) => group.items.length);
  }, [search]);

  return (
    <section className="faq-page">
      <header className="faq-topbar">
        <div className="faq-wordmark">Help Center</div>
        <label className="search-box faq-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            placeholder="Search frequently asked questions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="topbar-actions">
          <NotificationBell {...notificationProps} />
          <FaqButton active onClick={onOpenFaq} />
          <button className="avatar-button" type="button">
            {(currentUser?.name || currentUser?.email || "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <section className="faq-hero">
        <span>Support</span>
        <h1>Frequently Asked Questions</h1>
        <p>Quick answers for managing projects, tasks, alerts, and workspace data.</p>
      </section>

      <div className="faq-groups">
        {groups.map((group) => (
          <section className="faq-group" key={group.title}>
            <h2>{group.title}</h2>
            <div className="faq-list">
              {group.items.map((item) => {
                const key = `${group.title}:${item.question}`;
                const open = openQuestion === key;
                return (
                  <article className={`faq-item ${open ? "faq-item-open" : ""}`} key={key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenQuestion(open ? "" : key)}
                    >
                      <span>{item.question}</span>
                      <strong aria-hidden="true">{open ? "−" : "+"}</strong>
                    </button>
                    {open && <p>{item.answer}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {!groups.length && (
          <div className="empty-dashboard-state faq-empty">
            <p>No matching questions.</p>
            <span>Try a different search term.</span>
          </div>
        )}
      </div>
    </section>
  );
}
