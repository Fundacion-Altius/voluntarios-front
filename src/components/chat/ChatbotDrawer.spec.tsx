"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { ChatbotDrawer } from "./ChatbotDrawer";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockUseSession = jest.mocked(useSession);

const mockFetch = jest.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockAuthenticatedSession() {
  mockUseSession.mockReturnValue({
    data: { authToken: "test-token", user: { email: "a@b.com" } } as never,
    status: "authenticated",
    update: jest.fn(),
  } as unknown as ReturnType<typeof useSession>);
}

describe("ChatbotDrawer", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(jsonResponse({ chatbotDisplayName: "Alti" }));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("does not render the trigger when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<ChatbotDrawer />);
    expect(screen.queryByTestId("chatbot-drawer-trigger")).not.toBeInTheDocument();
  });

  it("shows the tenant chatbot display name on the FAB instead of Chat", async () => {
    mockAuthenticatedSession();
    render(<ChatbotDrawer />);

    const trigger = await screen.findByTestId("chatbot-drawer-trigger");
    await waitFor(() => {
      expect(trigger).toHaveTextContent("Alti");
    });
    expect(trigger).not.toHaveTextContent("Chat");
    expect(trigger).toHaveAttribute("aria-label", "Abrir Alti");
  });

  it("falls back to Asistente on the FAB when chatbotDisplayName is missing", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    mockAuthenticatedSession();
    render(<ChatbotDrawer />);

    const trigger = await screen.findByTestId("chatbot-drawer-trigger");
    expect(trigger).toHaveTextContent("Asistente");
    expect(trigger).toHaveAttribute("aria-label", "Abrir Asistente");
  });

  it("opens the right-side sheet with ChatbotPanel when the trigger is clicked", async () => {
    mockAuthenticatedSession();
    const user = userEvent.setup();
    render(<ChatbotDrawer />);

    const trigger = await screen.findByTestId("chatbot-drawer-trigger");
    expect(screen.queryByTestId("chatbot-drawer")).not.toBeInTheDocument();

    await user.click(trigger);

    const drawer = await screen.findByTestId("chatbot-drawer");
    expect(drawer).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("chatbot-drawer-title")).toHaveTextContent("Alti");
    });
    expect(screen.getByTestId("chatbot-panel")).toBeInTheDocument();
  });
});
