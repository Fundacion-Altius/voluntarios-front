"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DatosContrato } from "../types";

interface StepOneHorarioProps {
  contractData: DatosContrato;
  handleCheckboxChange: (name: string, value: string) => (checked: boolean | "indeterminate") => void;
  horarioOptions: { value: string; label: string }[];
  horarioOptionIds: Record<string, string>;
  t: any;
}

export function StepOneHorario({
  contractData,
  handleCheckboxChange,
  horarioOptions,
  horarioOptionIds,
  t,
}: StepOneHorarioProps) {
  return (
    <section className="form-group md:col-span-2">
      <p>
        {t("horarioTitulo")} <br />
        {t("horarioDescripcion")}
        <span className="text-destructive">*</span>{" "}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {horarioOptions.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={horarioOptionIds[option.value]}
              checked={
                contractData.horario
                  .split(", ")
                  .includes(option.value)
              }
              onCheckedChange={(checked) => {
                handleCheckboxChange("horario", option.value)(
                  checked
                );
              }}
            />
            <Label htmlFor={horarioOptionIds[option.value]}>
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </section>
  );
}