import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurveyTable } from "./SurveyTable";

const mockSurveys = [
  { id: 1, nombre: "Encuesta 1", departamento: "Ventas", minutos: 10, created_at: "2024-01-15" },
  { id: 2, nombre: "Encuesta 2", departamento: "Marketing", minutos: 15, created_at: "2024-02-20" },
];

const mockT = (key: string) => key;
const mockTCommon = (key: string) => key;

describe("SurveyTable", () => {
  const defaultProps = {
    surveys: mockSurveys,
    isLoading: false,
    deleteTarget: null,
    setDeleteTarget: jest.fn(),
    onDelete: jest.fn(),
    t: mockT,
    tCommon: mockTCommon,
  };

  it("renders survey list", () => {
    render(<SurveyTable {...defaultProps} />);
    expect(screen.getByText("Encuesta 1")).toBeInTheDocument();
    expect(screen.getByText("Encuesta 2")).toBeInTheDocument();
  });

  it("renders skeleton when loading", () => {
    render(<SurveyTable {...defaultProps} isLoading={true} />);
    const skeletons = screen.getAllByRole("generic");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no surveys", () => {
    render(<SurveyTable {...defaultProps} surveys={[]} />);
    expect(screen.getByText(/sinEncuestas/i)).toBeInTheDocument();
  });

  it("renders delete button for each survey", () => {
    render(<SurveyTable {...defaultProps} />);
    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("opens delete dialog when delete button clicked", async () => {
    const setDeleteTarget = jest.fn();
    render(<SurveyTable {...defaultProps} setDeleteTarget={setDeleteTarget} />);
    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
    await userEvent.click(deleteButtons[0]);
    expect(setDeleteTarget).toHaveBeenCalledWith(mockSurveys[0]);
  });

  it("renders survey duration badge", () => {
    render(<SurveyTable {...defaultProps} />);
    expect(screen.getByText("10 min")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
  });
});
