import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepFour from "./StepFour";
import { DatosContrato } from "../types";
import { TestProviders } from "../test-utils";

jest.mock("../lib/csrf", () => ({
  apiPost: jest.fn(),
}));

const mockContractData: DatosContrato = {
  nombre: "John Doe",
  id: "12345678Z",
  domicilio: "Calle Test 123",
  empresa: "",
  adulto: "SI",
  telefono: "600000000",
  email: "john@example.com",
  areas: ["CEPI"],
  modalidad: ["Presencial"],
  horario: "indistinto",
  duracion: "años",
  derechoConfidencialidad: true,
  derechoDatos: true,
  derechoImagen: true,
  fecha: "2024-01-15",
  lugar: "Madrid",
  firma: "data:image/png;base64,abc",
};

describe("StepFour Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders success message", () => {
    render(
      <TestProviders>
        <StepFour contractData={mockContractData} />
      </TestProviders>
    );
    expect(
      screen.getByText(/Tu contrato se ha enviado y procesado correctamente/i)
    ).toBeInTheDocument();
  });

  it("renders styled shadcn Button component", () => {
    render(
      <TestProviders>
        <StepFour contractData={mockContractData} />
      </TestProviders>
    );
    const buttons = document.querySelectorAll('[data-slot="button"]');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders download button", () => {
    render(
      <TestProviders>
        <StepFour contractData={mockContractData} />
      </TestProviders>
    );
    expect(
      screen.getByText(/Descargar contrato/i)
    ).toBeInTheDocument();
  });

  it("renders wrapped in a styled Card", () => {
    render(
      <TestProviders>
        <StepFour contractData={mockContractData} />
      </TestProviders>
    );
    const card = document.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });
});
