"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ModalidadT, DatosContrato } from "../types";

interface StepOneModalidadProps {
  contractData: DatosContrato;
  handleRadioChange: (name: string, value: string) => void;
  modalidadOptions: ModalidadT[];
  t: any;
}

export function StepOneModalidad({
  contractData,
  handleRadioChange,
  modalidadOptions,
  t,
}: StepOneModalidadProps) {
  return (
    <section className="form-group">
      <p>
        {t("modalidad")} <span style={{ color: "red" }}>*</span>{" "}
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
  );
}