import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import api, { setUnauthorizedHandler } from "./lib/api";

vi.mock("./lib/api", () => {
  const apiMock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: apiMock,
    setUnauthorizedHandler: vi.fn(),
  };
});

const project = {
  id: 1,
  name: "Roadmap App",
  description: "First project",
  tasks_count: 2,
  completed_tasks_count: 1,
  tasks_min_due_date: "2026-06-10",
};

const calendarItems = [
  {
    id: 11,
    type: "task",
    title: "Review backlog",
    description: "Prep sprint",
    starts_at: "2026-06-10T00:00:00.000000Z",
    status: "todo",
    project_id: 1,
    project_name: "Roadmap App",
  },
  {
    id: 12,
    type: "event",
    title: "Legacy Manual Event",
    starts_at: "2026-06-10T09:00:00.000000Z",
  },
];

const archiveItems = [
  {
    id: 2,
    type: "project",
    title: "Archived Project",
    category: "Project",
    size_label: "3 tasks",
    archived_at: "2026-06-01T00:00:00.000000Z",
  },
];

const trashItems = [
  {
    id: 3,
    type: "task",
    title: "Deleted Task",
    deleted_at: "2026-06-01T00:00:00.000000Z",
    expires_at: "2026-07-01T00:00:00.000000Z",
    project_id: 1,
  },
];

const workspaceSummary = {
  metrics: {
    active_projects: 3,
    projects_created_this_week: 1,
    tasks_completed_this_week: 4,
    previous_four_week_average: 2.5,
    due_today: 2,
    overdue: 1,
  },
  priority_project: {
    id: 1,
    name: "Roadmap App",
    overdue_tasks_count: 1,
    next_due_date: "2026-06-10",
    source: "automatic",
  },
  health: {
    todo: 2,
    in_progress: 1,
    done: 4,
    overdue: 1,
  },
  activities: [
    {
      id: 1,
      action: "task_completed",
      subject_name: "Review backlog",
      actor_name: "Test User",
      created_at: "2026-06-11T10:00:00Z",
    },
  ],
  notification_tasks: [
    {
      id: 11,
      title: "Review backlog",
      due_date: "2026-06-10",
      project_id: 1,
      project_name: "Roadmap App",
      is_overdue: true,
    },
  ],
};

function mockAuthenticatedGet() {
  api.get.mockImplementation((url) => {
    if (url === "/me") {
      return Promise.resolve({
        data: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          preferences: {
            desktop_notifications: false,
          },
        },
      });
    }
    if (url === "/projects") {
      return Promise.resolve({ data: { data: [project] } });
    }
    if (url === "/workspace-summary") {
      return Promise.resolve({ data: workspaceSummary });
    }
    if (url === "/calendar-events") {
      return Promise.resolve({ data: { data: calendarItems } });
    }
    if (url === "/archive") {
      return Promise.resolve({ data: { data: archiveItems } });
    }
    if (url === "/trash") {
      return Promise.resolve({ data: { data: trashItems } });
    }
    if (url === "/projects/1/tasks") {
      return Promise.resolve({
        data: {
          data: [],
          current_page: 1,
          last_page: 1,
          total: 0,
          from: 0,
          to: 0,
        },
      });
    }
    return Promise.resolve({ data: { data: [] } });
  });
}

describe("App integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    class NotificationMock {
      static permission = "default";
      static requestPermission = vi.fn().mockResolvedValue("granted");
    }
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: NotificationMock,
    });
    mockAuthenticatedGet();
  });

  it("renders the sign in form when no token exists", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show password/i })).toBeInTheDocument();
  });

  it("logs in with typed credentials and loads the dashboard", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "test-token",
        user: { id: 1, name: "Test User", email: "test@example.com" },
      },
    });

    render(<App />);

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i, { selector: "input" }), "password123");
    await userEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/login", {
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(await screen.findByText("TaskCurator")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("returns to sign in when unauthorized handler is triggered", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    const unauthorizedCallback = setUnauthorizedHandler.mock.calls[0][0];
    await act(async () => {
      unauthorizedCallback();
    });

    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/session expired\. please log in again\./i)).toBeInTheDocument();
  });

  it("logs out from the sidebar", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { message: "Logged out" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/logout");
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("enables desktop notifications and removes placeholder preferences", async () => {
    localStorage.setItem("token", "existing-token");
    api.put.mockResolvedValueOnce({
      data: {
        preferences: {
          desktop_notifications: true,
        },
      },
    });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByLabelText(/desktop notifications/i));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/me/preferences", {
        desktop_notifications: true,
      });
    });
    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(screen.queryByLabelText(/dark mode/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ai suggestions/i)).not.toBeInTheDocument();
  });

  it("renders workspace metrics from the summary API", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    const activeProjects = await screen.findByText("Active Projects");
    expect(within(activeProjects.closest("article")).getByText("3")).toBeInTheDocument();
    expect(screen.getByText("+1 this week")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/vs 2\.5 weekly avg/i)).toBeInTheDocument();
    expect(screen.getByText("Due Today")).toBeInTheDocument();
    expect(screen.queryByText(/hours tracked/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/72% avg/i)).not.toBeInTheDocument();
  });

  it("opens a critical task from the notification bell", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    await userEvent.click(
      await screen.findByRole("button", { name: /notifications \(1 urgent\)/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /review backlog/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/projects/1/tasks", {
        params: { page: 1 },
      });
    });
    expect(await screen.findByText(/good morning/i)).toBeInTheDocument();
  });

  it("opens the FAQ page from the shared help button", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    await userEvent.click(
      await screen.findByRole("button", { name: /frequently asked questions/i }),
    );
    expect(
      await screen.findByRole("heading", { name: /frequently asked questions/i }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /how do i create a project/i }),
    );
    expect(
      screen.getByText(/select new project from the sidebar/i),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText(/search frequently asked questions/i),
      "desktop notifications",
    );
    expect(
      screen.getByRole("button", { name: /how do i enable desktop notifications/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /how do i create a project/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(
      await screen.findByRole("button", { name: /frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it("opens the calculated priority project and shows real activity", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /projects/i }));
    expect(await screen.findByText("Workspace Priority")).toBeInTheDocument();
    expect(screen.getByText("Task completed")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open priority project/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/projects/1/tasks", {
        params: { page: 1 },
      });
    });
    expect(await screen.findByText(/good morning/i)).toBeInTheDocument();
  });

  it("switches calendar ranges and displays task-derived entries only", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /calendar/i }));
    expect(await screen.findByText("Review backlog")).toBeInTheDocument();
    expect(screen.queryByText("Legacy Manual Event")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ new event/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^week$/i }));
    expect(screen.getByRole("button", { name: /previous week/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^day$/i }));
    expect(screen.getByRole("button", { name: /next day/i })).toBeInTheDocument();
  });

  it("restores an archived item", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { message: "restored" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /archive/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^restore$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/projects/2/restore-archive");
    });
  });

  it("empties trash", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { message: "Trash emptied" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /trash/i }));
    await userEvent.click(screen.getByRole("button", { name: /empty trash/i }));
    await userEvent.click(screen.getAllByRole("button", { name: /empty trash/i }).at(-1));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/trash/empty");
    });
  });

  it("opens and focuses the project form from the global New Project button", async () => {
    localStorage.setItem("token", "existing-token");

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /\+ new project/i }));
    const input = await screen.findByPlaceholderText("Project name");
    expect(input).toHaveFocus();
  });

  it("sets a personal priority from the dashboard", async () => {
    localStorage.setItem("token", "existing-token");
    api.put.mockResolvedValueOnce({
      data: { priority_project: { id: 1, name: "Roadmap App" } },
    });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /set priority/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/me/priority-project", {
        project_id: 1,
      });
    });
  });

  it("moves an archived item to trash after confirmation", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { message: "moved" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /archive/i }));
    await userEvent.click(await screen.findByRole("button", { name: /move to trash/i }));
    await userEvent.click(screen.getAllByRole("button", { name: /move to trash/i }).at(-1));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/archive/projects/2/trash");
    });
  });
});
