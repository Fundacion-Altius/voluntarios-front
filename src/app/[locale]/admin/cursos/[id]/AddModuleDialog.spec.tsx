import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddModuleDialog } from './AddModuleDialog';
import { TestProviders } from '@/app/test-utils';

const mockT = (key: string) => key;
const mockTC = (key: string) => key;

describe("AddModuleDialog", () => {
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
    courseId: "1",
    newModuleTitle: "",
    setNewModuleTitle: jest.fn(),
    newModuleDescription: "",
    setNewModuleDescription: jest.fn(),
    newModuleOrder: "",
    setNewModuleOrder: jest.fn(),
    moduleDialogOpen: true,
    setModuleDialogOpen: jest.fn(),
    moduleSubmitting: false,
    onSubmit: jest.fn(),
    t: mockT,
    tc: mockTC,
  };

  it("renders dialog when open", () => {
    render(
      <TestProviders>
        <AddModuleDialog {...(defaultProps as any)} />
      </TestProviders>
    );
    expect(screen.getByText("nuevoModulo")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <TestProviders>
        <AddModuleDialog {...defaultProps} moduleDialogOpen={false} />
      </TestProviders>
    );
    expect(screen.queryByText("nuevoModulo")).not.toBeInTheDocument();
  });

  it("renders form fields", () => {
    render(
      <TestProviders>
        <AddModuleDialog {...(defaultProps as any)} />
      </TestProviders>
    );
    expect(screen.getByLabelText(/titulo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripcion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/orden/i)).toBeInTheDocument();
  });

  it("calls setNewModuleTitle when title input changes", async () => {
    const setNewModuleTitle = jest.fn();
    render(
      <TestProviders>
        <AddModuleDialog {...defaultProps} setNewModuleTitle={setNewModuleTitle} />
      </TestProviders>
    );
    const input = screen.getByLabelText(/titulo/i);
    await userEvent.type(input, "Módulo Test");
    expect(setNewModuleTitle).toHaveBeenCalled();
  });

  it("calls onSubmit when form is submitted", async () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <TestProviders>
        <AddModuleDialog {...defaultProps} onSubmit={onSubmit} />
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
