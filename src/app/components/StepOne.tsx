"use client";
import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useTranslations } from "next-intl";
import { AreasT, DatosContrato, ModalidadT } from "../types";
import { isUser, validateDNI } from "../utils";
import { Input } from "@/components/ui/input";
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
import { StepOneAreas } from "./StepOneAreas";
import { StepOneDuracion } from "./StepOneDuracion";
import { StepOneHorario } from "./StepOneHorario";
import { StepOneModalidad } from "./StepOneModalidad";

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
  const t = useTranslations("wizard.stepOne");
  const tc = useTranslations("wizard.common");
  const [optional, setOptional] = useState<string>("");
  const [dniError, setDniError] = useState<string>("");
  const [dniDuplicateError, setDniDuplicateError] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const modalidadOptions: ModalidadT[] = ["Presencial", "Online", "Híbrido"];
  const horarioOptions = [
    { value: "días laborables mañana", label: t("horarioDiasManana") },
    { value: "días laborables tarde", label: t("horarioDiasTarde") },
    { value: "fines de semana", label: t("horarioFines") },
    { value: "indistinto", label: t("horarioIndistinto") },
  ];
  const horarioOptionIds: Record<string, string> = {
    "días laborables mañana": "dias-lab-ma",
    "días laborables tarde": "dias-lab-ta",
    "fines de semana": "fines",
    indistinto: "ind",
  };

  const alertedDniRef = useRef<string | null>(null);

  const clearDuplicateDni = useCallback(() => {
    handleInputChange({
      target: { name: "id", value: "", type: "text" },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    setDniError("");
    setDniDuplicateError("");
  }, [handleInputChange]);

  const handleDuplicateDni = useCallback(
    (dni: string) => {
      if (alertedDniRef.current === dni) return;
      alertedDniRef.current = dni;
      alert(t("dniDuplicate"));
      clearDuplicateDni();
    },
    [clearDuplicateDni, t]
  );

  const validateDni = useCallback(
    async (dni: string) => {
      const normalized = dni.toUpperCase();
      if (alertedDniRef.current && alertedDniRef.current !== normalized) {
        alertedDniRef.current = null;
      }
      const dniIsValid = validateDNI(normalized);
      setDniError(dniIsValid ? "" : t("dniInvalid"));
      if (dniIsValid) {
        const isDuplicate = await isUser(normalized);
        setDniDuplicateError(
          isDuplicate ? t("dniDuplicate") : ""
        );
        if (isDuplicate && contractData.id === normalized) {
          handleDuplicateDni(normalized);
        }
      } else {
        setDniDuplicateError("");
      }
      setIsValidating(false);
    },
    [contractData.id, handleDuplicateDni, t]
  );

  useEffect(() => {
    const id = contractData.id;
    if (id.length >= 9) {
      setIsValidating(true);
      const timer = setTimeout(() => {
        validateDni(id);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDniError("");
      setDniDuplicateError("");
    }
  }, [contractData.id, validateDni]);

  const handleDniBlur = async () => {
    if (contractData.id.length >= 9) {
      setIsValidating(true);
      await validateDni(contractData.id);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractData.lugar) {
      alert(t("seleccioneCiudad"));
      return;
    }
    if (dniDuplicateError) {
      alert(dniDuplicateError);
      return;
    }
    if (await isUser(contractData.id)) {
      handleDuplicateDni(contractData.id);
    } else {
      nextStep();
    }
  };

  return (
    <div className="step">
      <p>
        <span style={{ color: "red" }}>*</span> {tc("campoObligatorio")}
      </p>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="form-group md:col-span-2">
          <Label htmlFor="nombre">
            {t("nombre")}{" "}
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
            onBlur={handleDniBlur}
            required
          />
          {shouldShowValidationText && <p>{t("validando")}</p>}
          {shouldShowSuccessMessage && <p data-testid="id-ok">{t("dniValido")}</p>}
          {shouldShowErrorMessage && <p style={{ color: "red" }} data-testid="id-error">{dniError}</p>}
          {dniDuplicateError && <p style={{ color: "red" }} data-testid="id-duplicate-error">{dniDuplicateError}</p>}
        </div>
        <div className="form-group">
          <Label htmlFor="domicilio">
            {t("domicilio")} <span style={{ color: "red" }}>*</span>{" "}
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
          <Label htmlFor="empresa">{t("empresa")}</Label>
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
            {t("mayorEdad")} <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <RadioGroup
            value={contractData.adulto}
            onValueChange={(value) => handleRadioChange("adulto", value)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SI" id="adulto-si" />
              <Label htmlFor="adulto-si">SI</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="NO" id="adulto-no" />
              <Label htmlFor="adulto-no">NO</Label>
            </div>
          </RadioGroup>
        </section>
        <div className="form-group">
          <Label htmlFor="telefono">
            {t("telefono")} <span style={{ color: "red" }}>*</span>{" "}
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
        <StepOneAreas
          contractData={contractData}
          setDatosContrato={setDatosContrato}
          optional={optional}
          setOptional={setOptional}
          handleCheckboxChange={handleCheckboxChange}
          t={t}
        />
        <StepOneDuracion
          contractData={contractData}
          setDatosContrato={setDatosContrato}
          handleRadioChange={handleRadioChange}
          t={t}
        />
        <StepOneModalidad
          contractData={contractData}
          handleRadioChange={handleRadioChange}
          modalidadOptions={modalidadOptions}
          t={t}
        />
        <div className="form-group">
          <Label htmlFor="lugar">
            {t("lugar")}{" "}
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
              <SelectValue placeholder={t("placeholderCiudad")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Madrid">Madrid</SelectItem>
              <SelectItem value="Barcelona">Barcelona</SelectItem>
              <SelectItem value="Valencia">Valencia</SelectItem>
              <SelectItem value="Sevilla">Sevilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <StepOneHorario
          contractData={contractData}
          handleCheckboxChange={handleCheckboxChange}
          horarioOptions={horarioOptions}
          horarioOptionIds={horarioOptionIds}
          t={t}
        />
        <div className="buttons md:col-span-2">
          <Button type="submit">{tc("siguiente")} {">"}</Button>
        </div>
      </form>
    </div>
  );
};

export default StepOne;