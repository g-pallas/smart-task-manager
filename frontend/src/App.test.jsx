import { act, render, screen, waitFor } from "@testing-library/react";
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

function mockAuthenticatedGet() {
  api.get.mockImplementation((url) => {
    if (url === "/me") {
      return Promise.resolve({
        data: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          preferences: {
            desktop_notifications: true,
            dark_mode: false,
            ai_suggestions: true,
          },
        },
      });
    }
    if (url === "/projects") {
      return Promise.resolve({ data: { data: [project] } });
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

  it("updates settings preferences", async () => {
    localStorage.setItem("token", "existing-token");
    api.put.mockResolvedValueOnce({
      data: {
        preferences: {
          desktop_notifications: true,
          dark_mode: true,
          ai_suggestions: true,
        },
      },
    });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByLabelText(/dark mode/i));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/me/preferences", {
        desktop_notifications: true,
        dark_mode: true,
        ai_suggestions: true,
      });
    });
  });

  it("creates a calendar event", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { id: 5, title: "Planning Review" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /calendar/i }));
    await userEvent.click(screen.getByRole("button", { name: /\+ new event/i }));
    await userEvent.type(screen.getByPlaceholderText(/event title/i), "Planning Review");
    await userEvent.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/calendar-events", {
        title: "Planning Review",
        description: null,
        starts_at: expect.stringMatching(/T09:00:00$/),
        ends_at: null,
        project_id: null,
        color: "indigo",
      });
    });
  });

  it("restores an archived item", async () => {
    localStorage.setItem("token", "existing-token");
    api.post.mockResolvedValueOnce({ data: { message: "restored" } });

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /archive/i }));
    await userEvent.click(await screen.findByRole("button", { name: /restore archived project/i }));

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

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/trash/empty");
    });
  });
});
