import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

describe("App integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form when no token exists", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("logs in and loads projects", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "test-token",
        user: { id: 1, name: "Test User", email: "test@example.com" },
      },
    });

    api.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            name: "Roadmap App",
            description: "First project",
          },
        ],
      },
    });

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/login", {
        email: "test2@example.com",
        password: "password123",
      });
    });

    expect(await screen.findByText("Roadmap App")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("returns to login when unauthorized handler is triggered", async () => {
    localStorage.setItem("token", "existing-token");

    api.get.mockResolvedValueOnce({
      data: {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
      },
    });

    render(<App />);

    const unauthorizedCallback =
      setUnauthorizedHandler.mock.calls[0][0];

    await act(async () => {
      unauthorizedCallback();
    });

    expect(await screen.findByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(
      screen.getByText(/session expired\. please log in again\./i),
    ).toBeInTheDocument();
  });

  it("shows project validation error and keeps form values on failed create", async () => {
    localStorage.setItem("token", "existing-token");

    api.get.mockResolvedValueOnce({
      data: {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
      },
    });

    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: "The name field is required.",
          errors: {
            name: ["The name field is required."],
          },
        },
      },
    });

    render(<App />);

    const nameInput = await screen.findByPlaceholderText(/project name/i);
    const descriptionInput = screen.getByPlaceholderText(/description/i);

    await userEvent.type(nameInput, "Temporary Project");
    await userEvent.type(descriptionInput, "Should stay in the form");
    await userEvent.click(screen.getByRole("button", { name: /create project/i }));

    const errorMessages = await screen.findAllByText(/the name field is required\./i);
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Temporary Project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Should stay in the form")).toBeInTheDocument();
  });

  it("shows task validation error and keeps task form values on failed create", async () => {
    localStorage.setItem("token", "existing-token");

    api.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              name: "Roadmap App",
              description: "First project",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          current_page: 1,
          last_page: 1,
          total: 0,
          from: 0,
          to: 0,
        },
      });

    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: "The due date field must be a valid date.",
          errors: {
            due_date: ["The due date field must be a valid date."],
          },
        },
      },
    });

    const { container } = render(<App />);

    await userEvent.click(await screen.findByText("Roadmap App"));

    const titleInput = await screen.findByPlaceholderText(/task title/i);
    const descriptionInput = screen.getByPlaceholderText(/task description/i);
    const dueDateInput = container.querySelector("input[type='date']");

    await userEvent.type(titleInput, "Broken Task");
    await userEvent.type(descriptionInput, "Should stay in task form");
    expect(dueDateInput).not.toBeNull();
    fireEvent.change(dueDateInput, { target: { value: "2026-03-10" } });
    await userEvent.click(screen.getByRole("button", { name: /add task/i }));

    const errorMessages = await screen.findAllByText(
      /the due date field must be a valid date\./i,
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Broken Task")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Should stay in task form"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-03-10")).toBeInTheDocument();
  });

  it("creates a task successfully and refreshes the task list", async () => {
    localStorage.setItem("token", "existing-token");

    api.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              name: "Roadmap App",
              description: "First project",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          current_page: 1,
          last_page: 1,
          total: 0,
          from: 0,
          to: 0,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 11,
              title: "Ship Task Flow",
              description: "Create and reload tasks",
              due_date: "2026-03-10",
              status: "todo",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      });

    api.post.mockResolvedValueOnce({
      data: {
        id: 11,
        title: "Ship Task Flow",
        description: "Create and reload tasks",
        due_date: "2026-03-10",
        status: "todo",
      },
    });

    const { container } = render(<App />);

    await userEvent.click(await screen.findByText("Roadmap App"));

    await userEvent.type(
      await screen.findByPlaceholderText(/task title/i),
      "Ship Task Flow",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/task description/i),
      "Create and reload tasks",
    );

    const dueDateInput = container.querySelector("input[type='date']");
    expect(dueDateInput).not.toBeNull();
    fireEvent.change(dueDateInput, { target: { value: "2026-03-10" } });

    await userEvent.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/projects/1/tasks", {
        title: "Ship Task Flow",
        description: "Create and reload tasks",
        due_date: "2026-03-10",
        status: "todo",
      });
    });

    expect(await screen.findByText("Ship Task Flow")).toBeInTheDocument();
    expect(screen.getByText("Create and reload tasks")).toBeInTheDocument();
    expect(screen.getByText(/task created\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/task title/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/task description/i)).toHaveValue("");
    expect(dueDateInput).toHaveValue("");
  });

  it("shows inline task edit validation errors and keeps edit values on failure", async () => {
    localStorage.setItem("token", "existing-token");

    api.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              name: "Roadmap App",
              description: "First project",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 11,
              title: "Existing Task",
              description: "Before edit",
              due_date: "2026-03-10",
              status: "todo",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      });

    api.put.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: "The due date field must be a valid date.",
          errors: {
            due_date: ["The due date field must be a valid date."],
          },
        },
      },
    });

    render(<App />);

    await userEvent.click(await screen.findByText("Roadmap App"));

    const taskSectionHeading = await screen.findByRole("heading", {
      name: /tasks: roadmap app/i,
    });
    const taskSection = taskSectionHeading.closest("section");
    expect(taskSection).not.toBeNull();

    await userEvent.click(
      within(taskSection).getByRole("button", { name: /^edit$/i }),
    );

    const editTitleInput = await screen.findByDisplayValue("Existing Task");
    const editDescriptionInput = screen.getByDisplayValue("Before edit");
    const editDueDateInput = taskSection.querySelector(
      ".space-y-2 input[type='date']",
    );

    expect(editTitleInput).toHaveValue("Existing Task");
    expect(editDueDateInput).not.toBeNull();
    await userEvent.type(
      editDescriptionInput,
      " but keep this draft",
    );
    fireEvent.change(editDueDateInput, { target: { value: "2026-03-11" } });

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    const errorMessages = await screen.findAllByText(
      /the due date field must be a valid date\./i,
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Before edit but keep this draft"),
    ).toBeInTheDocument();
    expect(editDueDateInput).toHaveValue("2026-03-11");
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
  });

  it("saves inline task edits successfully and refreshes the task row", async () => {
    localStorage.setItem("token", "existing-token");

    api.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              name: "Roadmap App",
              description: "First project",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 11,
              title: "Existing Task",
              description: "Before edit",
              due_date: "2026-03-10",
              status: "todo",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 11,
              title: "Edited Task",
              description: "After edit",
              due_date: "2026-03-12",
              status: "todo",
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
          from: 1,
          to: 1,
        },
      });

    api.put.mockResolvedValueOnce({
      data: {
        id: 11,
        title: "Edited Task",
        description: "After edit",
        due_date: "2026-03-12",
        status: "todo",
      },
    });

    render(<App />);

    await userEvent.click(await screen.findByText("Roadmap App"));

    const taskSectionHeading = await screen.findByRole("heading", {
      name: /tasks: roadmap app/i,
    });
    const taskSection = taskSectionHeading.closest("section");
    expect(taskSection).not.toBeNull();

    await userEvent.click(
      within(taskSection).getByRole("button", { name: /^edit$/i }),
    );

    const editTitleInput = await screen.findByDisplayValue("Existing Task");
    const editDescriptionInput = screen.getByDisplayValue("Before edit");
    const editDueDateInput = taskSection.querySelector(
      ".space-y-2 input[type='date']",
    );

    expect(editDueDateInput).not.toBeNull();

    await userEvent.clear(editTitleInput);
    await userEvent.type(editTitleInput, "Edited Task");
    await userEvent.clear(editDescriptionInput);
    await userEvent.type(editDescriptionInput, "After edit");
    fireEvent.change(editDueDateInput, { target: { value: "2026-03-12" } });

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/projects/1/tasks/11", {
        title: "Edited Task",
        description: "After edit",
        due_date: "2026-03-12",
      });
    });

    expect(await screen.findByText("Edited Task")).toBeInTheDocument();
    expect(screen.getByText("After edit")).toBeInTheDocument();
    expect(screen.getByText(/task updated\./i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^cancel$/i }),
    ).not.toBeInTheDocument();
  });
});
