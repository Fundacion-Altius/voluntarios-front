import React from "react";
import { DatosContrato } from "../types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StepThreeProps {
  contractData: DatosContrato;
  handleSubmit: () => void;
  prevStep: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const StepThree: React.FC<StepThreeProps> = ({
  contractData,
  handleInputChange,
  handleSubmit,
  prevStep,
}) => {
  return (
    <Card className="step">
      <CardContent className="space-y-4">
        <p>
          <span style={{ color: "red" }}>*</span> indica campo obligatorio
        </p>

        <div className="flex items-center gap-2">
          <Checkbox
            id="datos"
            name="derechoDatos"
            checked={contractData.derechoDatos}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "datos",
                  name: "derechoDatos",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="datos">
            Acepto la{" "}
            <Link href="/datos" target="_blank">
              autorización para tratamiento de datos
            </Link>{" "}
            <span style={{ color: "red" }}>*</span>
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="confidencialidad"
            name="derechoConfidencialidad"
            checked={contractData.derechoConfidencialidad}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "confidencialidad",
                  name: "derechoConfidencialidad",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="confidencialidad">
            Acepto la{" "}
            <Link href="/confidencialidad" target="_blank">
              autorización de confidencialidad
            </Link>{" "}
            <span style={{ color: "red" }}>*</span>
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="imagen"
            name="derechoImagen"
            checked={contractData.derechoImagen}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "imagen",
                  name: "derechoImagen",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="imagen">
            Acepto la{" "}
            <Link href="/imagen" target="_blank">
              cesión de derechos de imagen
            </Link>
          </Label>
        </div>
        <div className="buttons">
          <Button variant="outline" onClick={prevStep}>{"<"} Volver</Button>
          <Button onClick={handleSubmit} type="button">Enviar contrato</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepThree;
