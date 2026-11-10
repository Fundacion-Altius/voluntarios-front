import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ModalidadT } from "../types";
import { StepOneModalidad } from "./StepOneModalidad";
import { TestProviders } from "../test-utils";

describe("StepOneModalidad", () => {
  const modalidadOptions: ModalidadT[] = ["Presencial", "Online"];

  const defaultProps = {
    contractData: { modalidad: ["Presencial"] } as any,
    handleRadioChange: jest.fn(),
    modalidadOptions,
    t: (key: string) => key,
  };

  it("renders modalidad options", () => {
    render(
      <TestProviders>
        <StepOneModalidad {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByText("Presencial")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("selects the first modalidad from contractData", () => {
    render(
      <TestProviders>
        <StepOneModalidad {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByRole("radio", { name: "Presencial" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Online" })).not.toBeChecked();
  });

  it("handles empty modalidad array", () => {
    render(
      <TestProviders>
        <StepOneModalidad {...defaultProps} contractData={{ modalidad: [] } as any} />
      </TestProviders>
    );

    expect(screen.getByRole("radio", { name: "Presencial" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Online" })).not.toBeChecked();
  });

  it("calls handleRadioChange when a modalidad is selected", async () => {
    const user = userEvent.setup();
    const handleRadioChange = jest.fn();
    render(
      <TestProviders>
        <StepOneModalidad {...defaultProps} handleRadioChange={handleRadioChange} />
      </TestProviders>
    );

    const radio = screen.getByRole("radio", { name: "Online" });
    await user.click(radio);

    expect(handleRadioChange).toHaveBeenCalledWith("modalidad", "Online");
  });
});
