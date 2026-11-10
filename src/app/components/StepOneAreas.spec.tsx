import { render, screen, fireEvent } from "@testing-library/react";
import { StepOneAreas } from "./StepOneAreas";
import { TestProviders } from "../test-utils";

const areasOptions = [
  "Reparto de Alimentos",
  "Acompañamiento en la búsqueda de empleo",
  "Coaching",
  "Formación",
  "CEPI",
  "Nave",
  "Otra",
];

describe("StepOneAreas", () => {
  const defaultProps = {
    contractData: { areas: [] } as any,
    setDatosContrato: jest.fn(),
    optional: "",
    setOptional: jest.fn(),
    handleCheckboxChange: jest.fn(),
    t: (key: string) => key,
  };

  it("renders all area options", () => {
    render(
      <TestProviders>
        <StepOneAreas {...defaultProps} />
      </TestProviders>
    );

    areasOptions.forEach((area) => {
      expect(screen.getByText(area)).toBeInTheDocument();
    });
  });

  it("shows custom input when Otra is in contractData.areas", () => {
    render(
      <TestProviders>
        <StepOneAreas {...defaultProps} contractData={{ areas: ["Otra"] } as any} />
      </TestProviders>
    );

    expect(screen.getByPlaceholderText("placeholderOtraArea")).toBeInTheDocument();
  });

  it("shows custom input when optional is set", () => {
    render(
      <TestProviders>
        <StepOneAreas {...defaultProps} optional="Custom area" />
      </TestProviders>
    );

    expect(screen.getByPlaceholderText("placeholderOtraArea")).toBeInTheDocument();
  });

  it("updates optional when custom area input changes", () => {
    const setOptional = jest.fn();
    render(
      <TestProviders>
        <StepOneAreas
          {...defaultProps}
          contractData={{ areas: ["Otra"] } as any}
          setOptional={setOptional}
        />
      </TestProviders>
    );

    const input = screen.getByPlaceholderText("placeholderOtraArea");
    fireEvent.change(input, { target: { value: "Nueva area" } });

    expect(setOptional).toHaveBeenCalledWith("Nueva area");
  });
});
