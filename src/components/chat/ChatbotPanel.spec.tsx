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

let mePayload: unknown = {};

const mockFetch = jest.fn();
beforeEach(() => {
  mePayload = {};
  mockFetch.mockReset();
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `csrf_token=${CSRF_TOKEN}`;
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/auth/me") || url.includes("/api/tenants/current")) {
      return jsonResponse(mePayload);
    }
    return mockFetch(input, init);
  }) as typeof fetch;
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
    expect(screen.queryByTestId("hitl-approve")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hitl-deny")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("hitl-approve")).toHaveTextContent("Permitir");
    expect(screen.getByTestId("hitl-deny")).toHaveTextContent("Denegar");
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

  it("shows an in-chat thinking indicator while a send is in flight and hides it after resolve", async () => {
    mockAuthenticatedSession();

    let resolveMessages: (value: Response) => void = () => {};
    const messagesPromise = new Promise<Response>((resolve) => {
      resolveMessages = resolve;
    });

    mockFetch.mockImplementation(async (url: string) => {
      if (String(url).match(/\/api\/agent\/chat\/sessions$/)) {
        return jsonResponse({ id: "sess-think" });
      }
      return messagesPromise;
    });

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("chatbot-thinking")).toBeInTheDocument();
    });
    expect(screen.getByTestId("chatbot-thinking")).toHaveTextContent("Asistente");
    expect(screen.getByTestId("chatbot-thinking")).toHaveTextContent("Pensando…");
    expect(screen.getByTestId("chatbot-send")).toHaveTextContent("Enviando…");
    expect(screen.queryByText("respuesta lista")).not.toBeInTheDocument();

    resolveMessages(jsonResponse({ reply: "respuesta lista" }));

    await waitFor(() => {
      expect(screen.getByText("respuesta lista")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("chatbot-thinking")).not.toBeInTheDocument();
    expect(screen.getByTestId("chatbot-send")).toHaveTextContent("Enviar");
  });

  it("hides the thinking indicator when the send fails", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-err" }))
      .mockResolvedValueOnce(jsonResponse({}, 500));

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("chatbot-thinking")).not.toBeInTheDocument();
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

  it("renders assistant newlines with whitespace-pre-wrap", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-wrap" }))
      .mockResolvedValueOnce(
        jsonResponse({
          reply: "Actividades:\n• Taller\n• Comedor",
        }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "actividades");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByText(/Actividades:/)).toBeInTheDocument();
    });

    const bubbles = screen.getAllByTestId("chatbot-message-content");
    expect(bubbles[0]).toHaveClass("whitespace-pre-wrap");
    expect(bubbles[1]).toHaveClass("whitespace-pre-wrap");
    expect(bubbles[1].textContent).toBe("Actividades:\n• Taller\n• Comedor");
  });

  it("shows chatbotDisplayName from /api/auth/me in the panel header", async () => {
    mePayload = { chatbotDisplayName: "Alti" };
    mockAuthenticatedSession();
    render(<ChatbotPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("chatbot-panel-title")).toHaveTextContent("Alti");
    });
  });

  it("uses chatbotDisplayName from session create as the panel title", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({ id: "sess-name", chatbotDisplayName: "Alti" }),
      )
      .mockResolvedValueOnce(jsonResponse({ reply: "Hola" }));

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    expect(screen.getByTestId("chatbot-panel-title")).toHaveTextContent("Asistente");

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("chatbot-panel-title")).toHaveTextContent("Alti");
    });
  });

  it("POSTs approve with CSRF and Bearer then shows Aprobado", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-hitl-ok" }))
      .mockResolvedValueOnce(
        jsonResponse({
          content: "Necesito tu aprobación",
          toolCalls: [
            {
              toolName: "post--api-contracts",
              hitlStatus: "pending",
              hitlItemId: "hitl-1",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ decision: "approved", item: { id: "hitl-1" } }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-approve")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("hitl-approve"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-pending-notice")).toHaveTextContent("Aprobado");
    });
    expect(screen.queryByTestId("hitl-approve")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hitl-deny")).not.toBeInTheDocument();
    expect(screen.queryByText(/Esperando aprobación humana/)).not.toBeInTheDocument();

    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/hitl/hitl-1/approve"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expectedAuthHeaders(),
      }),
    );
  });

  it("POSTs deny with CSRF and Bearer then shows Denegado", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-hitl-deny" }))
      .mockResolvedValueOnce(
        jsonResponse({
          content: "Necesito tu aprobación",
          toolCalls: [
            {
              toolName: "post--api-contracts",
              hitlStatus: "pending",
              hitlItemId: "hitl-9",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ decision: "denied", item: { id: "hitl-9" } }),
      );

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-deny")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("hitl-deny"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-pending-notice")).toHaveTextContent("Denegado");
    });
    expect(screen.queryByTestId("hitl-approve")).not.toBeInTheDocument();

    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/hitl/hitl-9/deny"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expectedAuthHeaders(),
      }),
    );
  });

  it("disables HITL buttons while approve is in flight", async () => {
    mockAuthenticatedSession();

    let resolveApprove: (value: Response) => void = () => {};
    const approvePromise = new Promise<Response>((resolve) => {
      resolveApprove = resolve;
    });

    mockFetch.mockImplementation(async (url: string) => {
      if (String(url).match(/\/api\/agent\/chat\/sessions$/)) {
        return jsonResponse({ id: "sess-hitl-wait" });
      }
      if (String(url).includes("/messages")) {
        return jsonResponse({
          content: "Necesito tu aprobación",
          toolCalls: [
            {
              toolName: "post--api-contracts",
              hitlStatus: "pending",
              hitlItemId: "hitl-wait",
            },
          ],
        });
      }
      return approvePromise;
    });

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-approve")).toBeEnabled();
    });
    await user.click(screen.getByTestId("hitl-approve"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-approve")).toBeDisabled();
    });
    expect(screen.getByTestId("hitl-deny")).toBeDisabled();

    resolveApprove(jsonResponse({ decision: "approved", item: { id: "hitl-wait" } }));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-pending-notice")).toHaveTextContent("Aprobado");
    });
  });

  it("shows HITL API errors in the existing error area and keeps pending buttons", async () => {
    mockAuthenticatedSession();

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: "sess-hitl-err" }))
      .mockResolvedValueOnce(
        jsonResponse({
          content: "Necesito tu aprobación",
          toolCalls: [
            {
              toolName: "post--api-contracts",
              hitlStatus: "pending",
              hitlItemId: "hitl-err",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}, 500));

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "crear contrato");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByTestId("hitl-approve")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("hitl-approve"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("HITL API error: 500");
    });
    expect(screen.getByTestId("hitl-pending-notice")).toHaveTextContent(
      "Esperando aprobación humana",
    );
    expect(screen.getByTestId("hitl-approve")).toBeEnabled();
    expect(screen.getByTestId("hitl-deny")).toBeEnabled();
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
    ).toEqual([{ toolName: "explicit-tool" }]);
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
    ).toEqual([{ toolName: "post--api-contracts" }]);
  });

  it("includes hitlItemId from pending toolCalls", () => {
    expect(
      pendingToolsFromMessage({
        toolCalls: [
          {
            toolName: "post--api-contracts",
            hitlStatus: "pending",
            hitlItemId: "hitl-1",
          },
        ],
      }),
    ).toEqual([{ toolName: "post--api-contracts", hitlItemId: "hitl-1" }]);
  });

  it("attaches hitlItemId from matching pending toolCalls onto pendingTools names", () => {
    expect(
      pendingToolsFromMessage({
        pendingTools: ["post--api-contracts"],
        toolCalls: [
          {
            toolName: "post--api-contracts",
            hitlStatus: "pending",
            hitlItemId: "hitl-9",
          },
        ],
      }),
    ).toEqual([{ toolName: "post--api-contracts", hitlItemId: "hitl-9" }]);
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
