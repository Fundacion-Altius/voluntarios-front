"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { ChatbotPanel, pendingToolsFromMessage } from "./ChatbotPanel";

const originalRandomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
globalThis.crypto = globalThis.crypto ?? {} as Crypto;
(globalThis.crypto as { randomUUID: () => string }).randomUUID =
  originalRandomUUID ?? (() => Math.random().toString(36).slice(2));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockUseSession = jest.mocked(useSession);

const CSRF_TOKEN = "test-csrf";

const mockFetch = jest.fn();
beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `csrf_token=${CSRF_TOKEN}`;
});

function expectedAuthHeaders() {
  return expect.objectContaining({
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
    "X-CSRF-Token": CSRF_TOKEN,
  });
}

function mockAuthenticatedSession() {
  mockUseSession.mockReturnValue({
    data: { authToken: "test-token", user: { email: "a@b.com" } } as never,
    status: "authenticated",
    update: jest.fn(),
  } as unknown as ReturnType<typeof useSession>);
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("ChatbotPanel (6.1/6.2 frontend)", () => {
  it("shows login prompt when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<ChatbotPanel />);
    expect(
      screen.getByText(/iniciar sesión para usar el chatbot/i),
    ).toBeInTheDocument();
  });

  it("renders input + send button when authenticated", () => {
    mockAuthenticatedSession();

    render(<ChatbotPanel />);
    expect(screen.getByTestId("chatbot-input")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-send")).toBeInTheDocument();
  });

  it("creates a session then POSTs { content } to /messages and renders assistant reply", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-1" }))
      .mockResolvedValueOnce(
        jsonResponse({
          reply: "Hola desde el agente",
          pendingTools: [],
        }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByText("Hola desde el agente")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/agent\/chat\/sessions$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expectedAuthHeaders(),
      }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/agent/chat/sessions/sess-1/messages"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expectedAuthHeaders(),
        body: JSON.stringify({ content: "Hola" }),
      }),
    );
  });

  it("reuses the session id on a second message and only POSTs /messages", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-1" }))
      .mockResolvedValueOnce(jsonResponse({ reply: "primera" }))
      .mockResolvedValueOnce(jsonResponse({ reply: "segunda" }));

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "uno");
    await user.click(screen.getByTestId("chatbot-send"));
    await waitFor(() => {
      expect(screen.getByText("primera")).toBeInTheDocument();
    });

    await user.type(input, "dos");
    await user.click(screen.getByTestId("chatbot-send"));
    await waitFor(() => {
      expect(screen.getByText("segunda")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/agent\/chat\/sessions$/);
    expect(mockFetch.mock.calls[0][1].headers["X-CSRF-Token"]).toBe(CSRF_TOKEN);
    expect(mockFetch.mock.calls[1][0]).toContain(
      "/api/agent/chat/sessions/sess-1/messages",
    );
    expect(mockFetch.mock.calls[1][1].headers["X-CSRF-Token"]).toBe(CSRF_TOKEN);
    expect(mockFetch.mock.calls[2][0]).toContain(
      "/api/agent/chat/sessions/sess-1/messages",
    );
    expect(mockFetch.mock.calls[2][1].headers["X-CSRF-Token"]).toBe(CSRF_TOKEN);
    expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
      content: "dos",
    });
  });

  it("renders HITL pending notice when reply has pendingTools", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ sessionId: "sess-2" }))
      .mockResolvedValueOnce(
        jsonResponse({
          reply: "Necesito tu aprobación",
          pendingTools: ["post--api-contracts"],
        }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-pending-notice")).toBeInTheDocument();
    });
    expect(screen.getByTestId("hitl-pending-notice").textContent).toContain(
      "post--api-contracts",
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/agent/chat/sessions/sess-2/messages"),
      expect.objectContaining({
        method: "POST",
        headers: expectedAuthHeaders(),
        body: JSON.stringify({ content: "crear contrato" }),
      }),
    );
  });

  it("renders HITL pending notice from toolCalls with hitlStatus pending", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-3" }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "msg-1",
          role: "assistant",
          content: "Necesito tu aprobación",
          toolCalls: [
            {
              toolName: "post--api-contracts",
              hitlStatus: "pending",
              hitlItemId: "hitl-1",
              result: null,
              args: {},
            },
            {
              toolName: "get--api-users",
              hitlStatus: "done",
              hitlItemId: "hitl-2",
              result: {},
              args: {},
            },
          ],
        }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByText("Necesito tu aprobación")).toBeInTheDocument();
    });
    expect(screen.getByTestId("hitl-pending-notice")).toBeInTheDocument();
    expect(screen.getByTestId("hitl-pending-notice").textContent).toContain(
      "post--api-contracts",
    );
    expect(screen.getByTestId("hitl-pending-notice").textContent).not.toContain(
      "get--api-users",
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/agent/chat/sessions/sess-3/messages"),
      expect.objectContaining({
        method: "POST",
        headers: expectedAuthHeaders(),
        body: JSON.stringify({ content: "crear contrato" }),
      }),
    );
  });

  it("fetches /api/csrf-token when the cookie is missing then sends X-CSRF-Token", async () => {
    document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    mockAuthenticatedSession();

    mockFetch.mockImplementation(async (url: string) => {
      if (String(url).includes("/api/csrf-token")) {
        document.cookie = "csrf_token=csrf-from-endpoint";
        return jsonResponse({ csrfToken: "csrf-from-endpoint" });
      }
      if (String(url).match(/\/api\/agent\/chat\/sessions$/)) {
        return jsonResponse({ id: "sess-csrf" });
      }
      return jsonResponse({ reply: "ok" });
    });

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByText("ok")).toBeInTheDocument();
    });

    expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/csrf-token$/);
    expect(mockFetch.mock.calls[0][1]).toEqual({ credentials: "include" });
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/api\/agent\/chat\/sessions$/);
    expect(mockFetch.mock.calls[1][1].headers["X-CSRF-Token"]).toBe(
      "csrf-from-endpoint",
    );
    expect(mockFetch.mock.calls[2][0]).toContain(
      "/api/agent/chat/sessions/sess-csrf/messages",
    );
    expect(mockFetch.mock.calls[2][1].headers["X-CSRF-Token"]).toBe(
      "csrf-from-endpoint",
    );
    expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
      content: "Hola",
    });
  });
});

describe("pendingToolsFromMessage", () => {
  it("honors an explicit pendingTools array when present", () => {
    expect(
      pendingToolsFromMessage({
        pendingTools: ["explicit-tool"],
        toolCalls: [
          { toolName: "ignored-pending", hitlStatus: "pending" },
        ],
      }),
    ).toEqual(["explicit-tool"]);
  });

  it("derives toolName from toolCalls where hitlStatus is pending", () => {
    expect(
      pendingToolsFromMessage({
        id: "msg-1",
        role: "assistant",
        content: "ok",
        toolCalls: [
          { toolName: "post--api-contracts", hitlStatus: "pending" },
          { toolName: "get--api-users", hitlStatus: "approved" },
        ],
      }),
    ).toEqual(["post--api-contracts"]);
  });

  it("returns undefined when no pendingTools and no pending toolCalls", () => {
    expect(
      pendingToolsFromMessage({
        content: "ok",
        toolCalls: [{ toolName: "get--api-users", hitlStatus: "done" }],
      }),
    ).toBeUndefined();
  });
});
