"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { DatosContrato } from "../types";
import { v4 as uuidv4 } from "uuid";
import { apiPost } from "../lib/csrf";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StepFourProps {
  contractData: DatosContrato;
}
const StepFour: React.FC<StepFourProps> = ({ contractData }) => {
  const t = useTranslations("wizard.stepFour");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await apiPost("/api/generate-pdf", contractData);
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error downloading PDF:", errorData.message || errorData.error || t("errorDuplicado"));
        alert(errorData.message || errorData.error || t("errorDuplicado"));
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error downloading PDF:", errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        alert(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contrato${uuidv4()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="step">
      <CardContent className="space-y-4 text-center">
        <p>{t("contratoEnviado")}</p>
        <Button onClick={handleDownload} disabled={isLoading}>
          {isLoading ? t("descargando") : t("descargarContrato")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StepFour;
