"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { ChatbotPanel } from "./ChatbotPanel";

const originalRandomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
globalThis.crypto = globalThis.crypto ?? {} as Crypto;
(globalThis.crypto as { randomUUID: () => string }).randomUUID =
  originalRandomUUID ?? (() => Math.random().toString(36).slice(2));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockUseSession = jest.mocked(useSession);

const mockFetch = jest.fn();
beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
});

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
    mockUseSession.mockReturnValue({
      data: { authToken: "test-token", user: { email: "a@b.com" } } as never,
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<ChatbotPanel />);
    expect(screen.getByTestId("chatbot-input")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-send")).toBeInTheDocument();
  });

  it("POSTs to /api/agent/chat and renders assistant reply", async () => {
    mockUseSession.mockReturnValue({
      data: { authToken: "test-token", user: { email: "a@b.com" } } as never,
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        sessionId: "sess-1",
        reply: "Hola desde el agente",
        pendingTools: [],
      }),
    } as Response);

    const user = userEvent.setup();
    render(<ChatbotPanel />);

    const input = screen.getByTestId("chatbot-input") as HTMLTextAreaElement;
    await user.type(input, "Hola");
    await user.click(screen.getByTestId("chatbot-send"));

    await waitFor(() => {
      expect(screen.getByText("Hola desde el agente")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/agent/chat"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renders HITL pending notice when reply has pendingTools", async () => {
    mockUseSession.mockReturnValue({
      data: { authToken: "test-token", user: { email: "a@b.com" } } as never,
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        sessionId: "sess-2",
        reply: "Necesito tu aprobación",
        pendingTools: ["post--api-contracts"],
      }),
    } as Response);

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
  });
});
