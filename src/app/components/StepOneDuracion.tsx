"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatosContrato } from "../types";

interface StepOneDuracionProps {
  contractData: DatosContrato;
  setDatosContrato: React.Dispatch<React.SetStateAction<DatosContrato>>;
  handleRadioChange: (name: string, value: string) => void;
  t: any;
}

export function StepOneDuracion({
  contractData,
  setDatosContrato,
  handleRadioChange,
  t,
}: StepOneDuracionProps) {
  return (
    <section className="form-group md:col-span-2">
      <p>
        {t("duracionTitulo")} <br />
        {t("duracionDescripcion")}
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
                    onChange={(e) =>
                      setDatosContrato((prev) => ({ ...prev, duracion: e.target.value }))
                    }
                    placeholder={t("placeholderDuracion")}
                    required
                  />
                )}
            </div>
          )
        )}
      </RadioGroup>
    </section>
  );
}