import React, { useState } from "react";
import { DatosContrato } from "../types";
import { v4 as uuidv4 } from "uuid";
import { apiPost } from "../lib/csrf";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StepFourProps {
  contractData: DatosContrato;
}
const StepFour: React.FC<StepFourProps> = ({ contractData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await apiPost("/api/generate-pdf", contractData);
      if (response.status === 400) {
        throw new Error(
          "No se puede generar dos veces el mismo contrato para el mismo DNI/NIE. Recarga para intentar con otro DNI/NIE"
        );
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      /* 
      const data = await response.json();
      console.log({ data });
      const link = document.createElement("a");
      link.href = data.url;
      link.setAttribute("download", `${data.url}.pdf`);
      link.setAttribute("target", "_blank");

      document.body.appendChild(link);
      link.click();
      link.remove(); */

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
      alert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="step">
      <CardContent className="space-y-4 text-center">
        <p>Tu contrato se ha enviado y procesado correctamente</p>
        <Button onClick={handleDownload} disabled={isLoading}>
          {isLoading ? "Descargando PDF..." : "Descargar contrato"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StepFour;
