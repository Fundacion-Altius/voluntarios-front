import { render, screen } from "@testing-library/react";
import { CourseForm } from './CourseForm';
import { TestProviders } from '@/app/test-utils';
import userEvent from "@testing-library/user-event";

const mockT = (key: string) => key;
const mockTC = (key: string) => key;

describe("CourseForm", () => {
  const defaultProps = {
    course: {
      id: 1,
      title: "Curso Test",
      description: "Descripción test",
      level: "beginner",
      category: "General",
      image_url: "https://example.com/image.jpg",
      status: "active",
      lesson_count: 5,
      created_at: "2024-01-01",
      modules: [],
    },
    title: "Curso Test",
    description: "Descripción test",
    level: "beginner",
    category: "General",
    imageUrl: "https://example.com/image.jpg",
    submitting: false,
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    onLevelChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onImageUrlChange: jest.fn(),
    status: 'draft',
    onStatusChange: jest.fn(),
    onSubmit: jest.fn(),
    t: mockT,
    tc: mockTC,
  };

  it("renders form fields", () => {
    render(
      <TestProviders>
        <CourseForm {...(defaultProps as any)} />
      </TestProviders>
    );
    expect(screen.getByLabelText(/titulo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripcion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/urlImagen/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(
      <TestProviders>
        <CourseForm {...(defaultProps as any)} />
      </TestProviders>
    );
    expect(screen.getByRole("button", { name: /guardarCambios/i })).toBeInTheDocument();
  });

  it("disables submit when submitting", () => {
    render(
      <TestProviders>
        <CourseForm {...defaultProps} submitting={true} />
      </TestProviders>
    );
    expect(screen.getByRole("button", { name: /guardando/i })).toBeDisabled();
  });

  it("calls onTitleChange when title input changes", async () => {
    const onTitleChange = jest.fn();
    render(
      <TestProviders>
        <CourseForm {...defaultProps} onTitleChange={onTitleChange} />
      </TestProviders>
    );
    const input = screen.getByLabelText(/titulo/i);
    await userEvent.type(input, "Nuevo título");
    expect(onTitleChange).toHaveBeenCalled();
  });

  it("calls onSubmit when form is submitted", async () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <TestProviders>
        <CourseForm {...defaultProps} onSubmit={onSubmit} />
      </TestProviders>
    );
    const form = screen.getByLabelText(/titulo/i).closest("form");
    if (form) {
      await userEvent.type(screen.getByLabelText(/titulo/i), "Test");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      expect(onSubmit).toHaveBeenCalled();
    }
  });
});
