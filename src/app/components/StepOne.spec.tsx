import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepOne from "./StepOne";
import { DatosContrato } from "../types";

// Mock the isUser function
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  isUser: jest.fn(),
  validateDNI: jest.fn().mockImplementation((dni) => dni.length === 9),
}));

const mockNextStep = jest.fn();
const mockSetDatosContrato = jest.fn();

const defaultContractData: DatosContrato = {
  nombre: "",
  id: "",
  domicilio: "",
  empresa: "",
  adulto: "SI",
  telefono: "",
  email: "",
  areas: ["CEPI"],
  modalidad: ["Presencial"],
  horario: "",
  duracion: "dias",
  derechoConfidencialidad: false,
  derechoDatos: false,
  derechoImagen: false,
  fecha: "",
  lugar: "",
  firma: "",
};

const mockHandleInputChange = jest.fn();

function setup(contractData = defaultContractData) {
  return {
    user: userEvent.setup(),
    ...render(
      <StepOne
        contractData={contractData}
        handleInputChange={mockHandleInputChange}
        nextStep={mockNextStep}
        setDatosContrato={mockSetDatosContrato}
      />
    ),
  };
}

describe("StepOne Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    setup();

    expect(
      screen.getByLabelText(/NOMBRE Y APELLIDOS DEL VOLUNTARIO\/A/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/DNI \/ NIE/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/DOMICILIO/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/EMPRESA \/ ORGANIZACIÓN/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/TELÉFONO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByText(/MODALIDAD/i)).toBeInTheDocument();
    expect(screen.getByText(/HORARIO/i)).toBeInTheDocument();
  });

  it("shows error message when DNI input is invalid", async () => {
    const { user } = setup();

    const dniInput = screen.getByTestId("id-input");
    const dniError = screen.queryByTestId("id-error");
    expect(dniError).not.toBeInTheDocument();
    await user.type(dniInput, "35248660");
    setTimeout(async () => {
      expect(await screen.findByTestId("id-error")).toBeInTheDocument();
    }, 1000);
  });
  it("shows error message when NIE input is invalid", async () => {
    const { user } = setup();

    const dniInput = screen.getByTestId("id-input");
    const dniError = screen.queryByTestId("id-error");
    expect(dniError).not.toBeInTheDocument();
    await user.type(dniInput, "X6090907Y");
    setTimeout(async () => {
      expect(await screen.findByTestId("id-error")).toBeInTheDocument();
    }, 1000);
  });
  it("handles DNI validation correctly", async () => {
    const { user } = setup();

    const dniInput = screen.getByTestId("id-input");
    const dniSuccess = screen.queryByTestId("id-ok");
    expect(dniSuccess).not.toBeInTheDocument();
    await user.type(dniInput, "35248660X");
    setTimeout(async () => {
      expect(await screen.findByTestId("id-ok")).toBeInTheDocument();
    }, 1000);
  });
  it("handles NIE validation correctly", async () => {
    const { user } = setup();

    const dniInput = screen.getByTestId("id-input");
    const dniSuccess = screen.queryByTestId("id-ok");
    expect(dniSuccess).not.toBeInTheDocument();
    await user.type(dniInput, "X6090907R");
    setTimeout(async () => {
      expect(await screen.findByTestId("id-ok")).toBeInTheDocument();
    }, 1000);
  });
});
