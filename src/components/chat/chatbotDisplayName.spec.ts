import { getCSRFToken } from "@/app/lib/csrf";
import {
  chatbotDisplayNameFromSession,
  DEFAULT_CHATBOT_DISPLAY_NAME,
  ensureAgentChatSession,
  fetchAgentChatSessionById,
  resetAgentChatSessionCache,
  resolveChatbotDisplayName,
  sessionIdFromPayload,
} from "./chatbotDisplayName";

function altiSession(id = "sess-1") {
  return {
    id,
    agentIdentity: { chatbotDisplayName: "Alti" },
  };
}

describe("chatbotDisplayNameFromSession", () => {
  it("reads session.agentIdentity.chatbotDisplayName from a session resource", () => {
    expect(chatbotDisplayNameFromSession(altiSession())).toBe("Alti");
  });

  it("reads the same path when the payload wraps { session }", () => {
    expect(
      chatbotDisplayNameFromSession({
        session: altiSession("sess-wrap"),
      }),
    ).toBe("Alti");
  });

  it("does not read chatbotDisplayName from me/tenant/root fields", () => {
    expect(chatbotDisplayNameFromSession({ chatbotDisplayName: "Alti" })).toBeUndefined();
    expect(chatbotDisplayNameFromSession({ tenant: { chatbotDisplayName: "Alti" } })).toBeUndefined();
  });

  it("ignores blank strings", () => {
    expect(
      chatbotDisplayNameFromSession({
        id: "sess-1",
        agentIdentity: { chatbotDisplayName: "  " },
      }),
    ).toBeUndefined();
  });
});

describe("resolveChatbotDisplayName", () => {
  it("falls back to Asistente when the field is missing", () => {
    expect(resolveChatbotDisplayName({})).toBe(DEFAULT_CHATBOT_DISPLAY_NAME);
    expect(resolveChatbotDisplayName({ id: "sess-1" })).toBe("Asistente");
  });
});

describe("sessionIdFromPayload", () => {
  it("reads id from the session resource", () => {
    expect(sessionIdFromPayload(altiSession("sess-9"))).toBe("sess-9");
    expect(sessionIdFromPayload({ sessionId: "sess-2" })).toBe("sess-2");
  });
});

describe("ensureAgentChatSession / GET session", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    resetAgentChatSessionCache();
    document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "csrf_token=test-csrf";
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }

  it("POSTs /api/agent/chat/sessions and returns Alti from agentIdentity", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(altiSession("sess-1")));

    await expect(ensureAgentChatSession("test-token")).resolves.toEqual({
      sessionId: "sess-1",
      displayName: "Alti",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/agent\/chat\/sessions$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "X-CSRF-Token": "test-csrf",
        }),
      }),
    );
    expect(getCSRFToken()).toBe("test-csrf");
  });

  it("reuses the cached session instead of posting twice", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(altiSession("sess-1")));

    await ensureAgentChatSession("test-token");
    await ensureAgentChatSession("test-token");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to Asistente when agentIdentity is missing", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "sess-2" }));

    await expect(ensureAgentChatSession()).resolves.toEqual({
      sessionId: "sess-2",
      displayName: "Asistente",
    });
  });

  it("reads session.agentIdentity.chatbotDisplayName from GET session", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(altiSession("sess-9")));

    const data = await fetchAgentChatSessionById("sess-9", "test-token");
    expect(chatbotDisplayNameFromSession(data)).toBe("Alti");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/agent/chat/sessions/sess-9"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      }),
    );
  });
});
