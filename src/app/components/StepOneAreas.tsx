"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AreasT, DatosContrato } from "../types";

interface StepOneAreasProps {
  contractData: DatosContrato;
  setDatosContrato: React.Dispatch<React.SetStateAction<DatosContrato>>;
  optional: string;
  setOptional: React.Dispatch<React.SetStateAction<string>>;
  handleCheckboxChange: (name: string, value: string) => (checked: boolean | "indeterminate") => void;
  t: any;
}

export function StepOneAreas({
  contractData,
  setDatosContrato,
  optional,
  setOptional,
  handleCheckboxChange,
  t,
}: StepOneAreasProps) {
  const areasOptions: AreasT[] = [
    "Reparto de Alimentos",
    "Acompañamiento en la búsqueda de empleo",
    "Coaching",
    "Formación",
    "CEPI",
    "Nave",
    "Otra",
  ];

  return (
    <section className="form-group md:col-span-2">
      <p>
        {t("areasTitulo")}{" "}
        <span style={{ color: "red" }}>*</span>{" "}
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
                  placeholder={t("placeholderOtraArea")}
                  required
                />
              )}
          </div>
        ))}
      </div>
    </section>
  );
}