import { render, screen, fireEvent } from "@testing-library/react";
import { StepOneDuracion } from "./StepOneDuracion";
import { TestProviders } from "../test-utils";

describe("StepOneDuracion", () => {
  const defaultProps = {
    contractData: { duracion: "semanas" } as any,
    setDatosContrato: jest.fn(),
    handleRadioChange: jest.fn(),
    t: (key: string) => key,
  };

  it("renders duration options", () => {
    render(
      <TestProviders>
        <StepOneDuracion {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByText("días")).toBeInTheDocument();
    expect(screen.getByText("semanas")).toBeInTheDocument();
    expect(screen.getByText("meses")).toBeInTheDocument();
    expect(screen.getByText("años")).toBeInTheDocument();
    expect(screen.getByText("indeterminado")).toBeInTheDocument();
    expect(screen.getByText("otros")).toBeInTheDocument();
  });

  it("shows custom input when duracion is not in standard options", () => {
    render(
      <TestProviders>
        <StepOneDuracion {...defaultProps} contractData={{ duracion: "custom" } as any} />
      </TestProviders>
    );

    expect(screen.getByPlaceholderText("placeholderDuracion")).toBeInTheDocument();
  });

  it("does not show custom input for standard options", () => {
    render(
      <TestProviders>
        <StepOneDuracion {...defaultProps} contractData={{ duracion: "semanas" } as any} />
      </TestProviders>
    );

    expect(screen.queryByPlaceholderText("placeholderDuracion")).not.toBeInTheDocument();
  });

  it("calls handleRadioChange for standard options", () => {
    const handleRadioChange = jest.fn();
    render(
      <TestProviders>
        <StepOneDuracion {...defaultProps} handleRadioChange={handleRadioChange} />
      </TestProviders>
    );

    const radio = screen.getByRole("radio", { name: "meses" });
    fireEvent.click(radio);

    expect(handleRadioChange).toHaveBeenCalledWith("duracion", "meses");
  });

  it("sets duracion to empty when otros is selected", () => {
    const setDatosContrato = jest.fn();
    render(
      <TestProviders>
        <StepOneDuracion {...defaultProps} setDatosContrato={setDatosContrato} />
      </TestProviders>
    );

    const radio = screen.getByRole("radio", { name: "otros" });
    fireEvent.click(radio);

    expect(setDatosContrato).toHaveBeenCalledWith(expect.any(Function));
  });

  it("updates contractData.duracion when custom input changes", () => {
    const setDatosContrato = jest.fn();
    render(
      <TestProviders>
        <StepOneDuracion
          {...defaultProps}
          contractData={{ duracion: "custom" } as any}
          setDatosContrato={setDatosContrato}
        />
      </TestProviders>
    );

    const input = screen.getByPlaceholderText("placeholderDuracion");
    fireEvent.change(input, { target: { value: "3 meses" } });

    expect(setDatosContrato).toHaveBeenCalledWith(expect.any(Function));
  });
});
