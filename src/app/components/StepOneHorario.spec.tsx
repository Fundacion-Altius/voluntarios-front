import { render, screen } from "@testing-library/react";
import { StepOneHorario } from "./StepOneHorario";
import { TestProviders } from "../test-utils";

describe("StepOneHorario", () => {
  const horarioOptions = [
    { value: "manana", label: "Mañana" },
    { value: "tarde", label: "Tarde" },
  ];

  const defaultProps = {
    contractData: { horario: "manana, tarde" } as any,
    handleCheckboxChange: jest.fn(),
    horarioOptions,
    horarioOptionIds: { manana: "manana-id", tarde: "tarde-id" },
    t: (key: string) => key,
  };

  it("renders horario options", () => {
    render(
      <TestProviders>
        <StepOneHorario {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("Tarde")).toBeInTheDocument();
  });

  it("checks options present in contractData.horario", () => {
    render(
      <TestProviders>
        <StepOneHorario {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByRole("checkbox", { name: "Mañana" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Tarde" })).toBeChecked();
  });

  it("unchecks options not present in contractData.horario", () => {
    render(
      <TestProviders>
        <StepOneHorario {...defaultProps} contractData={{ horario: "manana" } as any} />
      </TestProviders>
    );

    expect(screen.getByRole("checkbox", { name: "Mañana" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Tarde" })).not.toBeChecked();
  });
});
