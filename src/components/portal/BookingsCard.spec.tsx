import { render, screen } from "@testing-library/react";
import { BookingsCard } from "./BookingsCard";
import { TestProviders } from '@/app/test-utils';

describe("BookingsCard", () => {
  it("renders empty state when no bookings", () => {
    render(
      <TestProviders>
        <BookingsCard bookings={[]} />
      </TestProviders>
    );
    expect(screen.getByText(/No tienes reservas próximas/i)).toBeInTheDocument();
  });

  it("renders booking list", () => {
    render(
      <TestProviders>
        <BookingsCard bookings={[
          { id: "1", date: "2024-01-15", shift: "Mañana", status: "confirmed" },
        ]} />
      </TestProviders>
    );
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });
});
