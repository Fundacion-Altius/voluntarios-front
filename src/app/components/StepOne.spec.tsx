import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import StepOne from "./StepOne";
import { DatosContrato, ModalidadT } from "../types";
import { TestProviders } from "../test-utils";

// Mock the isUser function
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  isUser: jest.fn(),
  validateDNI: jest.fn().mockImplementation((dni) => dni.length === 9),
}));

const mockNextStep = jest.fn();
const mockSetDatosContrato = jest.fn();
const mockHandleInputChange = jest.fn();
const mockHandleRadioChange = jest.fn();

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

function setup(contractData = defaultContractData) {
  return {
    user: userEvent.setup(),
    ...render(
      <TestProviders>
        <StepOne
          contractData={contractData}
          handleInputChange={mockHandleInputChange}
          handleRadioChange={mockHandleRadioChange}
          nextStep={mockNextStep}
          setDatosContrato={mockSetDatosContrato}
        />
      </TestProviders>
    ),
  };
}

function setupStateful(initialData = defaultContractData) {
  const Wrapper = () => {
    const [data, setData] = useState<DatosContrato>(initialData);
    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      if (type !== "checkbox") {
        setData((prev) => ({ ...prev, [name]: value }));
        return;
      }
      const { checked } = e.target;
      if (name === "areas") {
        setData((prev) => {
          const newAreas = checked
            ? [...prev.areas, value]
            : prev.areas.filter((a) => a !== value);
          return { ...prev, areas: newAreas };
        });
       } else if (name === "modalidad") {
         setData((prev) => {
           const newModalidad = checked
             ? [...prev.modalidad, value as ModalidadT]
             : prev.modalidad.filter((m) => m !== value);
           return { ...prev, modalidad: newModalidad };
         });
      } else if (name === "horario") {
        setData((prev) => {
          const current = prev.horario ? prev.horario.split(", ") : [];
          const next = checked
            ? Array.from(new Set([...current, value]))
            : current.filter((h) => h !== value);
          return { ...prev, horario: next.join(", ") };
        });
      } else {
        setData((prev) => ({ ...prev, [name]: checked }));
      }
    };
    const handleRadioChange = (name: string, value: string) => {
      if (name === "modalidad") {
        setData((prev) => ({ ...prev, modalidad: [value as ModalidadT] }));
      } else {
        setData((prev) => ({ ...prev, [name]: value }));
      }
    };
    return (
      <TestProviders>
        <StepOne
          contractData={data}
          handleInputChange={handleInputChange}
          handleRadioChange={handleRadioChange}
          nextStep={mockNextStep}
          setDatosContrato={setData}
        />
      </TestProviders>
    );
  };
  return {
    user: userEvent.setup(),
    ...render(<Wrapper />),
  };
}

describe("StepOne Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
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

    it("renders styled shadcn Input components", () => {
      setup();
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("renders styled shadcn Checkbox components", () => {
      setup();
      const checkboxes = document.querySelectorAll('[data-slot="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("renders styled shadcn Select component", () => {
      setup();
      expect(document.querySelector('[data-slot="select-trigger"]')).toBeInTheDocument();
    });

    it("renders styled shadcn Button component", () => {
      setup();
      expect(document.querySelector('[data-slot="button"]')).toBeInTheDocument();
    });
  });

  describe("DNI Validation", () => {
    it("shows validation messages for DNI field", () => {
      setup();

      expect(screen.getByText("indica campo obligatorio")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("has submit button", () => {
      setup();
      expect(screen.getByText("Siguiente >")).toBeInTheDocument();
    });

    it("does not call nextStep when ciudad is not selected", async () => {
      const { user } = setup();

      const submitButton = screen.getByText("Siguiente >");
      await user.click(submitButton);

      expect(mockNextStep).not.toHaveBeenCalled();
    });

    it("does not call nextStep when user is already registered", async () => {
      require("../utils").isUser.mockResolvedValue(true);

      const { user } = setup({
        ...defaultContractData,
        lugar: "Madrid",
      });

      const dniInput = screen.getByTestId("id-input");
      await user.type(dniInput, "12345678X");

      const submitButton = screen.getByText("Siguiente >");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNextStep).not.toHaveBeenCalled();
      });
    });

    it("clears DNI field when duplicate is detected", async () => {
       require("../utils").isUser.mockResolvedValue(true);

       setup({
         ...defaultContractData,
         lugar: "Madrid",
         id: "12345678X",
       });

       await waitFor(() => {
         expect(mockHandleInputChange).toHaveBeenCalledWith(
           expect.objectContaining({
             target: expect.objectContaining({
               name: "id",
               value: "",
             }),
           })
         );
       });
     });

    it("shows only one duplicate alert when blur and submit race", async () => {
      require("../utils").isUser.mockResolvedValue(true);
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      const { user } = setupStateful({
        ...defaultContractData,
        nombre: "John Doe",
        domicilio: "123 Main St",
        telefono: "123456789",
        email: "test@example.com",
        lugar: "Madrid",
      });

      const dniInput = screen.getByTestId("id-input");
      await user.type(dniInput, "12345678X");
      await user.click(screen.getByText("Siguiente >"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledTimes(1);
      });

      alertSpy.mockRestore();
    });
  });

  describe("Input Changes", () => {
    it("calls handleInputChange when name input changes", async () => {
      const { user } = setup();

      const nameInput = screen.getByLabelText(/NOMBRE Y APELLIDOS DEL VOLUNTARIO\/A/i);
      await user.type(nameInput, "John Doe");

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it("calls handleInputChange when DNI input changes", async () => {
      const { user } = setup();

      const dniInput = screen.getByTestId("id-input");
      await user.type(dniInput, "12345678X");

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it("calls handleInputChange when domicilio input changes", async () => {
      const { user } = setup();

      const domicilioInput = screen.getByLabelText(/DOMICILIO/i);
      await user.type(domicilioInput, "123 Main St");

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it("calls handleInputChange when telefono input changes", async () => {
      const { user } = setup();

      const telefonoInput = screen.getByLabelText(/TELÉFONO/i);
      await user.type(telefonoInput, "123456789");

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it("calls handleInputChange when email input changes", async () => {
      const { user } = setup();

      const emailInput = screen.getByLabelText(/EMAIL/i);
      await user.type(emailInput, "test@example.com");

      expect(mockHandleInputChange).toHaveBeenCalled();
    });
  });

  describe("Radio Group Changes", () => {
    it("calls handleRadioChange when modalidad changes", async () => {
      const { user } = setup();

      const onlineOption = screen.getByLabelText("Online");
      await user.click(onlineOption);

      expect(mockHandleRadioChange).toHaveBeenCalledWith("modalidad", "Online");
    });

    it("calls handleRadioChange when duracion changes", async () => {
      const { user } = setup();

      const mesesOption = screen.getByLabelText("meses");
      await user.click(mesesOption);

      expect(mockHandleRadioChange).toHaveBeenCalledWith("duracion", "meses");
    });
  });

   describe("Radio Changes", () => {
     it("calls handleRadioChange when adulto changes", async () => {
       const { user } = setup();

       const noOption = screen.getByLabelText("NO");
       await user.click(noOption);

       expect(mockHandleRadioChange).toHaveBeenCalledWith("adulto", "NO");
     });
   });

   describe("Checkbox Changes", () => {
     it("handles areas checkbox changes", async () => {
       const { user } = setup();

       const repartoOption = screen.getByLabelText("Reparto de Alimentos");
       await user.click(repartoOption);

       expect(mockHandleInputChange).toHaveBeenCalled();
     });

     it("handles horario checkbox changes", async () => {
       const { user } = setup();

       const diasLabMananaOption = screen.getByLabelText("Días laborables mañana");
       await user.click(diasLabMananaOption);

       expect(mockHandleInputChange).toHaveBeenCalled();
     });
   });

  describe("Select Changes", () => {
    it("renders select component", () => {
      setup();
      expect(screen.getByText("Seleccione una ciudad")).toBeInTheDocument();
    });
  });

  describe("Initial Data Display", () => {
    it("displays initial contract data", () => {
      const contractData: DatosContrato = {
        ...defaultContractData,
        nombre: "John Doe",
        id: "12345678X",
        domicilio: "123 Main St",
        empresa: "Test Company",
        telefono: "123456789",
        email: "test@example.com",
      };

      setup(contractData);

      const nameInput = screen.getByLabelText(/NOMBRE Y APELLIDOS DEL VOLUNTARIO\/A/i) as HTMLInputElement;
      expect(nameInput.value).toBe("John Doe");

      const dniInput = screen.getByTestId("id-input") as HTMLInputElement;
      expect(dniInput.value).toBe("12345678X");

      const domicilioInput = screen.getByLabelText(/DOMICILIO/i) as HTMLInputElement;
      expect(domicilioInput.value).toBe("123 Main St");
    });

    it("displays initial DNI value", () => {
      const contractData: DatosContrato = {
        ...defaultContractData,
        id: "12345678X",
      };

      setup(contractData);

      const dniInput = screen.getByTestId("id-input") as HTMLInputElement;
      expect(dniInput.value).toBe("12345678X");
    });
  });

  describe("Areas Options", () => {
    it("renders all area options", () => {
      setup();

      const expectedAreas = [
        "Reparto de Alimentos",
        "Acompañamiento en la búsqueda de empleo",
        "Coaching",
        "Formación",
        "CEPI",
        "Nave",
        "Otra"
      ];

      expectedAreas.forEach(area => {
        expect(screen.getByLabelText(area)).toBeInTheDocument();
      });
    });

    it("renders Otra area option", () => {
       setup();
       expect(screen.getByLabelText("Otra")).toBeInTheDocument();
     });

     it("opens Otra input when Otra checkbox is checked", async () => {
       const { user } = setupStateful();

       const otraCheckbox = screen.getByLabelText("Otra");
       await user.click(otraCheckbox);

       expect(screen.getByPlaceholderText("Especifique otra área")).toBeInTheDocument();
     });

     it("stores typed Otra area in contract data", async () => {
       const { user } = setupStateful();

       const otraCheckbox = screen.getByLabelText("Otra");
       await user.click(otraCheckbox);

       const otraInput = screen.getByPlaceholderText("Especifique otra área");
       await user.type(otraInput, "Jardinería");

       expect(otraInput).toHaveValue("Jardinería");
     });
   });

  describe("Modalidad Options", () => {
    it("renders all modalidad options", () => {
      setup();

      const expectedModalidades = ["Presencial", "Online", "Híbrido"];

      expectedModalidades.forEach((modalidad) => {
        expect(screen.getByLabelText(modalidad)).toBeInTheDocument();
      });
    });

    it("renders modalidad label with required indicator and red asterisk", () => {
      setup();
      const label = screen.getByText(/modalidad/i);
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("*");
      const asterisk = label.querySelector("span");
      expect(asterisk).toHaveTextContent("*");
      expect(asterisk).toHaveStyle("color: red");
    });

    it("sets radio group value from first modalidad option", () => {
      setup();
      const presencialRadio = screen.getByLabelText("Presencial");
      expect(presencialRadio).toBeInTheDocument();
      expect(presencialRadio).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Duracion Options", () => {
    it("renders all duracion options", () => {
      setup();

      const expectedDuraciones = ["días", "semanas", "meses", "años", "indeterminado", "otros"];

      expectedDuraciones.forEach(duracion => {
        expect(screen.getByLabelText(duracion)).toBeInTheDocument();
      });
    });

    it("shows custom input for otros duracion", async () => {
      const { user } = setup();

      const otrosOption = screen.getByLabelText("otros");
      await user.click(otrosOption);

      // Should show custom input for "otros"
      expect(screen.getByPlaceholderText("Especifique duración")).toBeInTheDocument();
    });
  });

   describe("Horario Options", () => {
     it("renders all horario options", () => {
       setup();

       const expectedHorarios = [
         "Días laborables mañana",
         "Días laborables tarde",
         "Fines de semana",
         "Indistintamente"
       ];

       expectedHorarios.forEach(horario => {
         expect(screen.getByLabelText(horario)).toBeInTheDocument();
       });
     });

     it("allows selecting multiple horario options", async () => {
       const { user } = setupStateful();

       const morning = screen.getByLabelText("Días laborables mañana");
       const weekend = screen.getByLabelText("Fines de semana");
       await user.click(morning);
       await user.click(weekend);

       expect(morning).toHaveAttribute("aria-checked", "true");
       expect(weekend).toHaveAttribute("aria-checked", "true");
     });
   });

  describe("Form Validation Messages", () => {
    it("shows required field indicators", () => {
      setup();

      const requiredIndicators = screen.getAllByText("*");
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it("shows validation messages for DNI field", () => {
      setup();

      expect(screen.getByText("indica campo obligatorio")).toBeInTheDocument();
    });
  });
});
