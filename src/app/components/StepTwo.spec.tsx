import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepTwo from "./StepTwo";
import { DatosContrato } from "../types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillStyle: "",
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    toDataURL: jest.fn().mockReturnValue("data:image/png;base64,abc"),
  });
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

const mockHandleSignature = jest.fn();
const mockNextStep = jest.fn();
const mockPrevStep = jest.fn();

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
      <StepTwo
        contractData={contractData}
        handleSignature={mockHandleSignature}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    ),
  };
}

describe("StepTwo Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the contract text with volunteer name and id", () => {
    setup();
    expect(screen.getByText(/POR UNA PARTE, FUNDACIÓN ALTIUS ESPAÑA/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/12345678Z/)).toBeInTheDocument();
  });

  it("renders the signature canvas", () => {
    setup();
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders navigation shadcn Buttons", () => {
    setup();
    const buttons = document.querySelectorAll('[data-slot="button"]');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Volver/)).toBeInTheDocument();
    expect(screen.getByText(/Siguiente/)).toBeInTheDocument();
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

  it("renders Reiniciar firma button", () => {
    setup();
    expect(screen.getByText(/Reiniciar firma/)).toBeInTheDocument();
  });
});
