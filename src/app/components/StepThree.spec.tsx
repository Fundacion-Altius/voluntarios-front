import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepThree from "./StepThree";
import { DatosContrato } from "../types";

const mockHandleSubmit = jest.fn();
const mockPrevStep = jest.fn();
const mockHandleInputChange = jest.fn();

const defaultContractData: DatosContrato = {
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
  derechoConfidencialidad: false,
  derechoDatos: false,
  derechoImagen: false,
  fecha: "2024-01-15",
  lugar: "Madrid",
  firma: "",
};

function setup(contractData = defaultContractData) {
  return {
    user: userEvent.setup(),
    ...render(
      <StepThree
        contractData={contractData}
        handleSubmit={mockHandleSubmit}
        prevStep={mockPrevStep}
        handleInputChange={mockHandleInputChange}
      />
    ),
  };
}

describe("StepThree Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders styled shadcn Checkbox components", () => {
    setup();
    const checkboxes = document.querySelectorAll('[data-slot="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it("renders consent checkboxes with correct labels", () => {
    setup();
    expect(screen.getByText(/tratamiento de datos/i)).toBeInTheDocument();
    expect(screen.getByText(/confidencialidad/i)).toBeInTheDocument();
    expect(screen.getByText(/cesión de derechos de imagen/i)).toBeInTheDocument();
  });

  it("renders styled shadcn Button components", () => {
    setup();
    const buttons = document.querySelectorAll('[data-slot="button"]');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Volver/)).toBeInTheDocument();
    expect(screen.getByText(/Enviar contrato/)).toBeInTheDocument();
  });

  it("renders wrapped in a styled Card", () => {
    setup();
    const card = document.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it("calls prevStep when Volver is clicked", async () => {
    const { user } = setup();
    await user.click(screen.getByText(/Volver/));
    expect(mockPrevStep).toHaveBeenCalledTimes(1);
  });

  it("calls handleSubmit when Enviar contrato is clicked", async () => {
    const { user } = setup();
    await user.click(screen.getByText(/Enviar contrato/));
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders links to legal pages", () => {
    setup();
    expect(screen.getByRole("link", { name: /autorización para tratamiento de datos/i })).toHaveAttribute("href", "/datos");
    expect(screen.getByRole("link", { name: /autorización de confidencialidad/i })).toHaveAttribute("href", "/confidencialidad");
    expect(screen.getByRole("link", { name: /cesión de derechos de imagen/i })).toHaveAttribute("href", "/imagen");
  });
});
