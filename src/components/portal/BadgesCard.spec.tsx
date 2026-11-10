import { render, screen } from "@testing-library/react";
import { BadgesCard } from "./BadgesCard";
import { TestProviders } from '@/app/test-utils';

describe("BadgesCard", () => {
  it("renders badges list", () => {
    const badges = [{ id: "1", badge_type: "first-login" }, { id: "2", badge_type: "course-completed" }];
    render(
      <TestProviders>
        <BadgesCard badges={badges} />
      </TestProviders>
    );
    expect(screen.getByText("Insignias")).toBeInTheDocument();
    expect(screen.getByText("first login")).toBeInTheDocument();
    expect(screen.getByText("course completed")).toBeInTheDocument();
  });

  it("returns null when no badges", () => {
    const { container } = render(
      <TestProviders>
        <BadgesCard badges={[]} />
      </TestProviders>
    );
    expect(container.firstChild).toBeNull();
  });
});
