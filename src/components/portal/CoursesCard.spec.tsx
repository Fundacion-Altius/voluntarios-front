import { render, screen } from "@testing-library/react";
import { CoursesCard } from "./CoursesCard";
import { TestProviders } from '@/app/test-utils';

const mockCourses = [
  { id: "1", course_id: "101", course_title: "Curso 1", status: "completed", progress_pct: 100 },
  { id: "2", course_id: "102", course_title: "Curso 2", status: "in_progress", progress_pct: 50 },
  { id: "3", course_id: "103", course_title: "Curso 3", status: "in_progress", progress_pct: 30 },
];

describe("CoursesCard", () => {
  it("renders courses title", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    expect(screen.getByText("Mis cursos")).toBeInTheDocument();
  });

  it("renders up to 3 courses", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    expect(screen.getByText("Curso 1")).toBeInTheDocument();
    expect(screen.getByText("Curso 2")).toBeInTheDocument();
    expect(screen.getByText("Curso 3")).toBeInTheDocument();
  });

  it("renders completed badge for finished course", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    expect(screen.getByText("Completado")).toBeInTheDocument();
  });

  it("renders progress percentage for incomplete course", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders progress bar when progress > 0", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeTruthy();
  });

  it("renders verMas link", () => {
    render(
      <TestProviders>
        <CoursesCard courses={mockCourses} />
      </TestProviders>
    );
    const link = screen.getByRole("link", { name: /Ver más/i });
    expect(link).toHaveAttribute("href", "/es/portal/cursos");
  });
});
