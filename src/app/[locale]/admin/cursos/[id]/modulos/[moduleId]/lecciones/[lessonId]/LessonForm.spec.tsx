import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonForm } from './LessonForm';
import { TestProviders } from '@/app/test-utils';

const mockT = (key: string) => key;
const mockTC = (key: string) => key;

describe("LessonForm", () => {
  const defaultProps = {
    title: "Lección Test",
    setTitle: jest.fn(),
    contentType: "text",
    setContentType: jest.fn(),
    content: "Contenido test",
    setContent: jest.fn(),
    contentUrl: "",
    setContentUrl: jest.fn(),
    submitting: false,
    error: "",
    setError: jest.fn(),
    successMsg: "",
    setSuccessMsg: jest.fn(),
    isLoading: false,
    onSubmit: jest.fn(),
    t: mockT,
    tc: mockTC,
  };

  it("renders form fields when not loading", () => {
    render(
      <TestProviders>
        <LessonForm {...defaultProps} />
      </TestProviders>
    );
    expect(screen.getByLabelText(/titulo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contenido/i)).toBeInTheDocument();
  });

  it("renders loading skeletons when loading", () => {
    render(
      <TestProviders>
        <LessonForm {...defaultProps} isLoading={true} />
      </TestProviders>
    );
    const skeletons = document.querySelectorAll('[class*="h-10"], [class*="h-48"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error message when provided", () => {
    render(
      <TestProviders>
        <LessonForm {...defaultProps} error="Error de prueba" />
      </TestProviders>
    );
    expect(screen.getByText("Error de prueba")).toBeInTheDocument();
  });

  it("calls setTitle when title input changes", async () => {
    const setTitle = jest.fn();
    render(
      <TestProviders>
        <LessonForm {...defaultProps} setTitle={setTitle} />
      </TestProviders>
    );
    const input = screen.getByLabelText(/titulo/i);
    await userEvent.type(input, "Nuevo título");
    expect(setTitle).toHaveBeenCalled();
  });

  it("calls onSubmit when form is submitted", async () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <TestProviders>
        <LessonForm {...defaultProps} onSubmit={onSubmit} />
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
