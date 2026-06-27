"use client";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { AreasT, DatosContrato, ModalidadT } from "../types";
import { isUser, validateDNI } from "../utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface StepOneProps {
  contractData: DatosContrato;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleRadioChange: (name: string, value: string) => void;
  nextStep: () => void;
  setDatosContrato: Dispatch<SetStateAction<DatosContrato>>;
}

const StepOne: React.FC<StepOneProps> = ({
  contractData,
  handleInputChange,
  handleRadioChange,
  nextStep,
  setDatosContrato,
}) => {
  const [optional, setOptional] = useState<string>("");
  const [dniError, setDniError] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const areasOptions: AreasT[] = [
    "Reparto de Alimentos",
    "Acompañamiento en la búsqueda de empleo",
    "Coaching",
    "Formación",
    "CEPI",
    "Nave",
    "Otra",
  ];
  const modalidadOptions: ModalidadT[] = ["Presencial", "Online", "Híbrido"];
  useEffect(() => {
    const id = contractData.id;
    if (id.length >= 9) {
      setIsValidating(true);
      const timer = setTimeout(() => {
        const dniIsValid = validateDNI(id.toUpperCase());
        setDniError(dniIsValid ? "" : "El DNI/NIE no es válido");
        setIsValidating(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDniError("");
    }
  }, [contractData.id]);

  const shouldShowValidationText = contractData.id !== "" && isValidating;
  const shouldShowSuccessMessage =
    contractData.id.length >= 9 && !dniError && !isValidating;
  const shouldShowErrorMessage = contractData.id.length >= 9 && dniError;

  const handleCheckboxChange = (name: string, value: string) => (checked: boolean | "indeterminate") => {
    handleInputChange({
      target: {
        name,
        value,
        type: "checkbox",
        checked: checked as boolean,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="step">
      <p>
        <span style={{ color: "red" }}>*</span> indica campo obligatorio
      </p>
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await isUser(contractData.id)) {
            alert(
              "El DNI/NIE ya está registrado en el sistema. Contáctanos para más información"
            );
            setDatosContrato({
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
              derechoConfidencialidad: false,
              derechoDatos: false,
              derechoImagen: false,
              fecha: "",
              lugar: "",
              firma: "",
            });
          } else {
            nextStep();
          }
        }}
      >
        <div className="form-group md:col-span-2">
          <Label htmlFor="nombre">
            NOMBRE Y APELLIDOS DEL VOLUNTARIO/A{" "}
            <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Input
            type="text"
            id="nombre"
            name="nombre"
            value={contractData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <Label htmlFor="id">
            DNI / NIE <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Input
            type="text"
            data-testid="id-input"
            id="id"
            name="id"
            value={contractData.id}
            onChange={handleInputChange}
            required
          />
          {shouldShowValidationText && <p>Validando...</p>}
          {shouldShowSuccessMessage && <p data-testid="id-ok">DNI/NIE con formato válido</p>}
          {shouldShowErrorMessage && <p style={{ color: "red" }} data-testid="id-error">{dniError}</p>}
        </div>
        <div className="form-group">
          <Label htmlFor="domicilio">
            DOMICILIO <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Input
            type="text"
            id="domicilio"
            name="domicilio"
            value={contractData.domicilio}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group md:col-span-2">
          <Label htmlFor="empresa">EMPRESA / ORGANIZACIÓN</Label>
          <Input
            type="text"
            id="empresa"
            name="empresa"
            value={contractData.empresa}
            onChange={handleInputChange}
          />
        </div>
        <section className="form-group">
          <p>
            Mayor de edad <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <div className="flex gap-4">
            <Checkbox
              id="adulto-si"
              checked={contractData.adulto === "SI"}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleInputChange({
                    target: { name: "adulto", value: "SI", type: "radio", checked: true },
                  } as unknown as React.ChangeEvent<HTMLInputElement>);
                }
              }}
            />
            <Label htmlFor="adulto-si">SI</Label>
            <Checkbox
              id="adulto-no"
              checked={contractData.adulto === "NO"}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleInputChange({
                    target: { name: "adulto", value: "NO", type: "radio", checked: true },
                  } as unknown as React.ChangeEvent<HTMLInputElement>);
                }
              }}
            />
            <Label htmlFor="adulto-no">NO</Label>
          </div>
        </section>
        <div className="form-group">
          <Label htmlFor="telefono">
            TELÉFONO <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Input
            type="tel"
            id="telefono"
            name="telefono"
            value={contractData.telefono}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group md:col-span-2">
          <Label htmlFor="email">
            EMAIL <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={contractData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <section className="form-group md:col-span-2">
          <p>
            LA ACTIVIDAD DE VOLUNTARIADO SE ENMARCA EN UNA DE LAS SIGUIENTES
            ÁREAS <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {areasOptions.map((area) => (
              <div key={area} className="flex items-center gap-2">
                <Checkbox
                  id={area}
                  checked={
                    area === "Otra"
                      ? !!optional || contractData.areas.includes("Otra")
                      : contractData.areas.includes(area)
                  }
                  onCheckedChange={(checked) => {
                    if (area === "Otra") {
                      if (checked) {
                        setDatosContrato((prevData) => ({
                          ...prevData,
                          areas: [...prevData.areas, "Otra"],
                        }));
                      } else {
                        setDatosContrato((prevData) => ({
                          ...prevData,
                          areas: prevData.areas.filter(
                            (a) => a !== "Otra" && a !== optional
                          ),
                        }));
                        setOptional("");
                      }
                    } else {
                      handleCheckboxChange("areas", area)(checked);
                    }
                  }}
                />
                <Label htmlFor={area}>{area}</Label>
                {area === "Otra" &&
                  (contractData.areas.includes("Otra") || !!optional) && (
                    <Input
                      style={{ marginInlineStart: "1rem" }}
                      type="text"
                      id="otraArea"
                      name="otraArea"
                      value={optional}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setOptional(newValue);
                        setDatosContrato((prevData) => ({
                          ...prevData,
                          areas: [
                            ...prevData.areas.filter(
                              (a) => a !== optional && a !== "Otra"
                            ),
                            newValue || "Otra",
                          ],
                        }));
                      }}
                      placeholder="Especifique otra área"
                      required
                    />
                  )}
              </div>
            ))}
          </div>
        </section>
        <section className="form-group md:col-span-2">
          <p>
            DURACIÓN <br />
            El presente acuerdo tiene una duración de (indicar lo que proceda).
            Cualquiera de las partes puede dejar sin efecto este acuerdo
            notificándolo con una antelación de 15 días naturales.
            <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <RadioGroup
            value={["días", "semanas", "meses", "años", "indeterminado"].includes(contractData.duracion ?? "") ? contractData.duracion! : "otros"}
            onValueChange={(value) => {
              if (value === "otros") {
                setDatosContrato((prev) => ({ ...prev, duracion: "" }));
              } else {
                handleRadioChange("duracion", value);
              }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {["días", "semanas", "meses", "años", "indeterminado", "otros"].map(
              (option) => (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>{option}</Label>
                  {option === "otros" &&
                    !["días", "semanas", "meses", "años", "indeterminado"].includes(contractData.duracion ?? "") && (
                      <Input
                        style={{ marginLeft: "1rem" }}
                        type="text"
                        name="duracion"
                        value={contractData.duracion}
                        onChange={handleInputChange}
                        placeholder="Especifique duración"
                        required
                      />
                    )}
                </div>
              )
            )}
          </RadioGroup>
        </section>
        <section className="form-group">
          <p>
            MODALIDAD <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <RadioGroup
            value={contractData.modalidad[0] || ""}
            onValueChange={(value) => handleRadioChange("modalidad", value)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {modalidadOptions.map((modalidad: ModalidadT) => (
              <div key={modalidad} className="flex items-center gap-2">
                <RadioGroupItem value={modalidad} id={modalidad} />
                <Label htmlFor={modalidad}>{modalidad}</Label>
              </div>
            ))}
          </RadioGroup>
        </section>
        <div className="form-group">
          <Label htmlFor="lugar">
            LUGAR DE LA ACTIVIDAD DE VOLUNTARIADO{" "}
            <span style={{ color: "red" }}>*</span>{" "}
          </Label>
          <Select
            value={contractData.lugar}
            onValueChange={(value) => {
              handleInputChange({
                target: { name: "lugar", value, type: "select-one" },
              } as unknown as React.ChangeEvent<HTMLSelectElement>);
            }}
          >
            <SelectTrigger id="lugar" className="w-full">
              <SelectValue placeholder="Seleccione una ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Madrid">Madrid</SelectItem>
              <SelectItem value="Barcelona">Barcelona</SelectItem>
              <SelectItem value="Valencia">Valencia</SelectItem>
              <SelectItem value="Sevilla">Sevilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <section className="form-group md:col-span-2">
          <p>
            HORARIO <br />
            Las actividades se llevarán a cabo en el siguiente horario:
            <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dias-lab-ma"
                checked={contractData.horario === "días laborables mañana"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange({
                      target: { name: "horario", value: "días laborables mañana", type: "radio" },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              />
              <Label htmlFor="dias-lab-ma">Días laborables mañana</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dias-lab-ta"
                checked={contractData.horario === "días laborables tarde"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange({
                      target: { name: "horario", value: "días laborables tarde", type: "radio" },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              />
              <Label htmlFor="dias-lab-ta">Días laborables tarde</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="fines"
                checked={contractData.horario === "fines de semana"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange({
                      target: { name: "horario", value: "fines de semana", type: "radio" },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              />
              <Label htmlFor="fines">Fines de semana</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ind"
                checked={contractData.horario === "indistinto"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange({
                      target: { name: "horario", value: "indistinto", type: "radio" },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              />
              <Label htmlFor="ind">Indistintamente</Label>
            </div>
          </div>
        </section>
        <div className="buttons md:col-span-2">
          <Button type="submit">Siguiente {">"}</Button>
        </div>
      </form>
    </div>
  );
};

export default StepOne;
