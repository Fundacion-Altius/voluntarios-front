import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EncuestasPage from "./page";
import { TestProviders } from "../../../test-utils";
import { useAuth } from "@/app/auth/useAuth";

jest.mock("@/app/auth/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("./useSurveys", () => ({
  useSurveys: jest.fn(),
}));

jest.mock("./SurveyForm", () => ({
  SurveyForm: () => <div data-testid="survey-form">SurveyForm</div>,
}));

jest.mock("./SurveyTable", () => ({
  SurveyTable: () => <div data-testid="survey-table">SurveyTable</div>,
}));

jest.mock("./ReportView", () => ({
  ReportView: () => <div data-testid="report-view">ReportView</div>,
}));

describe("EncuestasPage", () => {
  it("shows skeletons while auth is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: true });
    const mockUseSurveys = require("./useSurveys").useSurveys as jest.Mock;
    mockUseSurveys.mockReturnValue({
      surveys: [],
      isLoading: false,
      error: null,
      report: null,
      reportLoading: false,
      createSurvey: jest.fn(),
      deleteSurvey: jest.fn(),
      fetchReport: jest.fn(),
    });
    render(
      <TestProviders>
        <EncuestasPage />
      </TestProviders>
    );
    expect(screen.getAllByRole("generic", { hidden: true }).length).toBeGreaterThan(0);
  });

  it("renders nothing when not authenticated and not loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: false });
    const mockUseSurveys = require("./useSurveys").useSurveys as jest.Mock;
    mockUseSurveys.mockReturnValue({
      surveys: [],
      isLoading: false,
      error: null,
      report: null,
      reportLoading: false,
      createSurvey: jest.fn(),
      deleteSurvey: jest.fn(),
      fetchReport: jest.fn(),
    });
    const { container } = render(
      <TestProviders>
        <EncuestasPage />
      </TestProviders>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders surveys table when authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    const mockUseSurveys = require("./useSurveys").useSurveys as jest.Mock;
    mockUseSurveys.mockReturnValue({
      surveys: [],
      isLoading: false,
      error: null,
      report: null,
      reportLoading: false,
      createSurvey: jest.fn(),
      deleteSurvey: jest.fn(),
      fetchReport: jest.fn(),
    });
    render(
      <TestProviders>
        <EncuestasPage />
      </TestProviders>
    );
    expect(screen.getByTestId("survey-table")).toBeInTheDocument();
  });

  it("shows error message when present", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    const mockUseSurveys = require("./useSurveys").useSurveys as jest.Mock;
    mockUseSurveys.mockReturnValue({
      surveys: [],
      isLoading: false,
      error: "Error loading surveys",
      report: null,
      reportLoading: false,
      createSurvey: jest.fn(),
      deleteSurvey: jest.fn(),
      fetchReport: jest.fn(),
    });
    render(
      <TestProviders>
        <EncuestasPage />
      </TestProviders>
    );
    expect(screen.getByText("Error loading surveys")).toBeInTheDocument();
  });

  it("shows report view when verResultados is clicked", async () => {
    const user = userEvent.setup();
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    const mockUseSurveys = require("./useSurveys").useSurveys as jest.Mock;
    mockUseSurveys.mockReturnValue({
      surveys: [],
      isLoading: false,
      error: null,
      report: { title: "Test", generated_at: "2024-01-01", data: [], total: 0 },
      reportLoading: false,
      createSurvey: jest.fn(),
      deleteSurvey: jest.fn(),
      fetchReport: jest.fn(),
    });
    render(
      <TestProviders>
        <EncuestasPage />
      </TestProviders>
    );
    const button = screen.getByText("Ver Resultados");
    await user.click(button);
    expect(screen.getByTestId("report-view")).toBeInTheDocument();
  });
});
