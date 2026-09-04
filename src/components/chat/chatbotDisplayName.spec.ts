import {
  chatbotDisplayNameFromPayload,
  DEFAULT_CHATBOT_DISPLAY_NAME,
  fetchChatbotDisplayName,
  resolveChatbotDisplayName,
} from "./chatbotDisplayName";

describe("chatbotDisplayNameFromPayload", () => {
  it("reads chatbotDisplayName from the payload root", () => {
    expect(chatbotDisplayNameFromPayload({ chatbotDisplayName: "Alti" })).toBe("Alti");
  });

  it("reads nested tenant.chatbotDisplayName", () => {
    expect(
      chatbotDisplayNameFromPayload({
        tenant: { chatbotDisplayName: "Alti" },
      }),
    ).toBe("Alti");
  });

  it("reads snake_case on settings", () => {
    expect(
      chatbotDisplayNameFromPayload({
        settings: { chatbot_display_name: "Alti" },
      }),
    ).toBe("Alti");
  });

  it("ignores blank strings", () => {
    expect(chatbotDisplayNameFromPayload({ chatbotDisplayName: "  " })).toBeUndefined();
  });
});

describe("resolveChatbotDisplayName", () => {
  it("falls back to Asistente when the field is missing", () => {
    expect(resolveChatbotDisplayName({})).toBe(DEFAULT_CHATBOT_DISPLAY_NAME);
    expect(resolveChatbotDisplayName(null)).toBe("Asistente");
  });
});

describe("fetchChatbotDisplayName", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }

  it("returns Alti from GET /api/auth/me", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ chatbotDisplayName: "Alti" }));

    await expect(fetchChatbotDisplayName("test-token")).resolves.toBe("Alti");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/me$/),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: { Authorization: "Bearer test-token" },
      }),
    );
  });

  it("falls back to tenant settings when me has no display name", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ role: "admin" }))
      .mockResolvedValueOnce(jsonResponse({ chatbotDisplayName: "Alti" }));

    await expect(fetchChatbotDisplayName()).resolves.toBe("Alti");
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/api\/tenants\/current$/);
  });

  it("returns undefined when no source exposes the field", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({})).mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(fetchChatbotDisplayName()).resolves.toBeUndefined();
  });
});
