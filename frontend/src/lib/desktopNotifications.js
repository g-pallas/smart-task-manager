const storageKey = (userId, date) => `taskcurator:notified:${userId}:${date}`;
export const NOTIFICATION_OPEN_EVENT = "taskcurator:open-notification";

const localDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const requestDesktopNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  return (await Notification.requestPermission()) === "granted";
};

export const notifyDueTasks = (tasks, userId) => {
  if (!("Notification" in window) || Notification.permission !== "granted" || !userId) {
    return;
  }

  const date = localDateKey();
  const key = storageKey(userId, date);
  const notified = new Set(JSON.parse(localStorage.getItem(key) || "[]"));

  tasks.forEach((task) => {
    const taskId = String(task.id);
    if (notified.has(taskId)) return;

    const timing = task.is_overdue ? "overdue" : "due today";
    const notification = new Notification(
      task.is_overdue ? `Overdue: ${task.title}` : `Due today: ${task.title}`,
      {
      body: `${task.project_name || "TaskCurator"} • ${timing}`,
      tag: `${key}:${taskId}`,
      },
    );
    notification.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_OPEN_EVENT, {
          detail: {
            taskId: task.id,
            projectId: task.project_id,
          },
        }),
      );
      notification.close?.();
    };
    notified.add(taskId);
  });

  localStorage.setItem(key, JSON.stringify([...notified]));
};
