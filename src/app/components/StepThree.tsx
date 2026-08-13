"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { DatosContrato } from "../types";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("wizard.stepThree");
  const tc = useTranslations("wizard.common");

  const handleClick = async () => {
    try {
      await handleSubmit();
    } catch (error) {
      alert(error instanceof Error ? error.message : t("errorEnviar"));
    }
  };

  return (
    <Card className="step">
      <CardContent className="space-y-4">
        <p>
          <span style={{ color: "red" }}>*</span> {tc("campoObligatorio")}
        </p>

        <div className="flex items-center gap-2">
          <Checkbox
            id="datos"
            checked={contractData.derechoDatos}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "datos",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="datos">
            {t("aceptoDatosPrefix")}{" "}
            <Link href="/datos" target="_blank">
              {t("autorizacionDatos")}
            </Link>{" "}
            <span style={{ color: "red" }}>*</span>
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="confidencialidad"
            checked={contractData.derechoConfidencialidad}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "confidencialidad",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="confidencialidad">
            {t("aceptoConfPrefix")}{" "}
            <Link href="/confidencialidad" target="_blank">
              {t("autorizacionConfidencialidad")}
            </Link>{" "}
            <span style={{ color: "red" }}>*</span>
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="imagen"
            checked={contractData.derechoImagen}
            onCheckedChange={(checked) =>
              handleInputChange({
                target: {
                  id: "imagen",
                  type: "checkbox",
                  checked: checked as boolean,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Label htmlFor="imagen">
            {t("aceptoImgPrefix")}{" "}
            <Link href="/imagen" target="_blank">
              {t("cesionImagen")}
            </Link>
          </Label>
        </div>
        <div className="buttons">
          <Button variant="outline" onClick={prevStep}>{"<"} {tc("volver")}</Button>
          <Button onClick={handleClick} type="button">{t("enviarContrato")}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepThree;
