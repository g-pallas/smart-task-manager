import {
  NOTIFICATION_OPEN_EVENT,
  notifyDueTasks,
  requestDesktopNotificationPermission,
} from "./desktopNotifications";

describe("desktop notifications", () => {
  beforeEach(() => {
    localStorage.clear();
    window.focus = vi.fn();
  });

  it("requests browser permission", async () => {
    const NotificationMock = vi.fn();
    NotificationMock.permission = "default";
    NotificationMock.requestPermission = vi.fn().mockResolvedValue("granted");
    globalThis.Notification = NotificationMock;
    window.Notification = NotificationMock;

    await expect(requestDesktopNotificationPermission()).resolves.toBe(true);
    expect(NotificationMock.requestPermission).toHaveBeenCalledOnce();
  });

  it("notifies each due task only once per day", () => {
    const notification = { close: vi.fn(), onclick: null };
    const NotificationMock = vi.fn(function NotificationConstructor() {
      return notification;
    });
    NotificationMock.permission = "granted";
    globalThis.Notification = NotificationMock;
    window.Notification = NotificationMock;
    const tasks = [
      {
        id: 10,
        title: "Submit report",
        project_name: "Roadmap",
        project_id: 4,
        is_overdue: true,
      },
    ];

    notifyDueTasks(tasks, 7);
    notifyDueTasks(tasks, 7);

    expect(NotificationMock).toHaveBeenCalledOnce();
    expect(NotificationMock).toHaveBeenCalledWith(
      "Overdue: Submit report",
      expect.objectContaining({ body: "Roadmap • overdue" }),
    );

    const listener = vi.fn();
    window.addEventListener(NOTIFICATION_OPEN_EVENT, listener);
    notification.onclick();
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].detail).toEqual({
      taskId: 10,
      projectId: 4,
    });
    window.removeEventListener(NOTIFICATION_OPEN_EVENT, listener);
  });
});
