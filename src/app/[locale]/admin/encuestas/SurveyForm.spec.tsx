import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurveyForm } from "./SurveyForm";
import { TestProviders } from '@/app/test-utils';

const mockT = (key: string) => key;
const mockTCommon = (key: string) => key;

window.alert = jest.fn();

describe("SurveyForm", () => {
  const defaultProps = {
    createOpen: true,
    setCreateOpen: jest.fn(),
    onSubmit: jest.fn(),
    formError: "",
    setFormError: jest.fn(),
    successMsg: "",
    setSuccessMsg: jest.fn(),
    t: mockT,
    tCommon: mockTCommon,
  };

  it("renders dialog when open", () => {
    render(
      <TestProviders>
        <SurveyForm {...defaultProps} />
      </TestProviders>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <TestProviders>
        <SurveyForm {...defaultProps} createOpen={false} />
      </TestProviders>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders form fields", () => {
    render(
      <TestProviders>
        <SurveyForm {...defaultProps} />
      </TestProviders>
    );
    expect(screen.getByPlaceholderText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/departamento/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10/)).toBeInTheDocument();
  });

  it("submits form with correct values", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const setSuccessMsg = jest.fn();
    render(
      <TestProviders>
        <SurveyForm {...defaultProps} onSubmit={onSubmit} setSuccessMsg={setSuccessMsg} />
      </TestProviders>
    );

    await userEvent.type(screen.getByPlaceholderText(/nombre/i), "Encuesta Test");
    await userEvent.type(screen.getByPlaceholderText(/departamento/i), "Ventas");
    await userEvent.type(screen.getByPlaceholderText(/10/), "10");

    const submitButton = screen.getByRole("button", { name: /crearEncuesta/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Encuesta Test", "Ventas", 10);
    });
  });

  it("shows error on failed submit", async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error("Error")));
    const setFormError = jest.fn();
    render(
      <TestProviders>
        <SurveyForm {...defaultProps} onSubmit={onSubmit} setFormError={setFormError} />
      </TestProviders>
    );

    await userEvent.type(screen.getByPlaceholderText(/nombre/i), "Test");
    await userEvent.type(screen.getByPlaceholderText(/departamento/i), "Dept");
    await userEvent.type(screen.getByPlaceholderText(/10/), "5");

    const submitButton = screen.getByRole("button", { name: /crearEncuesta/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(setFormError).toHaveBeenCalledWith("Error");
    });
  });
});
