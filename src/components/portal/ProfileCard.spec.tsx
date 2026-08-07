import { render, screen } from "@testing-library/react";
import { ProfileCard } from "./ProfileCard";
import { TestProviders } from '@/app/test-utils';

const mockProfile = {
  level: "gold",
  totalPoints: 1500,
  weekPoints: 200,
  currentStreak: 5,
  badges: [{ id: "1", badge_type: "first-login" }],
};

describe("ProfileCard", () => {
  it("renders profile data", () => {
    render(
      <TestProviders>
        <ProfileCard profile={mockProfile} />
      </TestProviders>
    );
    expect(screen.getByText("Mi Perfil")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText(/5 semanas/)).toBeInTheDocument();
  });

  it("renders level badge with correct class", () => {
    render(
      <TestProviders>
        <ProfileCard profile={mockProfile} />
      </TestProviders>
    );
    const badge = screen.getByText("Oro");
    expect(badge).toHaveClass("bg-yellow-500");
  });

  it("renders action buttons", () => {
    render(
      <TestProviders>
        <ProfileCard profile={mockProfile} />
      </TestProviders>
    );
    expect(screen.getByText("Descargar certificado")).toBeInTheDocument();
    expect(screen.getByText("Compartir tarjeta")).toBeInTheDocument();
  });
});
