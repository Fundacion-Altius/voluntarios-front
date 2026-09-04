"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { ChatbotDrawer } from "./ChatbotDrawer";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockUseSession = jest.mocked(useSession);

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

  it("does not render the trigger when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<ChatbotDrawer />);
    expect(screen.queryByTestId("chatbot-drawer-trigger")).not.toBeInTheDocument();
  });

  it("opens the right-side sheet with ChatbotPanel when the trigger is clicked", async () => {
    mockAuthenticatedSession();
    const user = userEvent.setup();
    render(<ChatbotDrawer />);

    const trigger = screen.getByTestId("chatbot-drawer-trigger");
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-drawer")).not.toBeInTheDocument();

    await user.click(trigger);

    const drawer = await screen.findByTestId("chatbot-drawer");
    expect(drawer).toBeInTheDocument();
    expect(screen.getByText("Chatbot Klaruk")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-panel")).toBeInTheDocument();
  });
});
