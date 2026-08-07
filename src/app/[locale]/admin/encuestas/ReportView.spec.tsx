import { render, screen } from "@testing-library/react";
import { ReportView } from "./ReportView";

const mockT = (key: string) => key;

const mockReport = {
  title: "Reporte de Encuesta",
  generated_at: "2024-01-15T10:00:00Z",
  data: [
    { questionId: 1, questionText: "¿Recomendarías?", averageRating: 4.5, totalAnswers: 100 },
    { questionId: 2, questionText: "¿Claro?", averageRating: 3.8, totalAnswers: 80 },
  ],
  total: 180,
};

describe("ReportView", () => {
  const defaultProps = {
    report: mockReport,
    reportLoading: false,
    onBack: jest.fn(),
    t: mockT,
  };

  it("renders report data", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("¿Recomendarías?")).toBeInTheDocument();
    expect(screen.getByText("¿Claro?")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("3.8")).toBeInTheDocument();
  });

  it("renders total answers", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText(/totalRespuestas/i)).toBeInTheDocument();
  });

  it("renders generation timestamp", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText(/generado/i)).toBeInTheDocument();
  });

  it("renders loading skeletons", () => {
    render(<ReportView {...defaultProps} reportLoading={true} />);
    const skeletons = screen.getAllByRole("generic");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders no data message when report is null", () => {
    render(<ReportView {...defaultProps} report={null} />);
    expect(screen.getByText(/sinDatosReporte/i)).toBeInTheDocument();
  });

  it("renders answer count per question", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("100 respuestas")).toBeInTheDocument();
    expect(screen.getByText("80 respuestas")).toBeInTheDocument();
  });
});
