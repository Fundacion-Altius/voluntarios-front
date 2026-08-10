import { render, screen } from "@testing-library/react";
import { CoursesSection } from "./CoursesSection";
import { TestProviders } from '@/app/test-utils';

describe("CoursesSection", () => {
  it("renders courses", () => {
    render(
      <TestProviders>
        <CoursesSection courses={[
          { id: "1", course_title: "Curso 1", status: "completed", progress_pct: 100 },
        ]} coursesLoading={false} />
      </TestProviders>
    );
    expect(screen.getByText("Curso 1")).toBeInTheDocument();
  });
});
