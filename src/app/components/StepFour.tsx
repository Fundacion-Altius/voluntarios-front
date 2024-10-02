import React, { useState } from "react";
import { DatosContrato } from "../types";
import { v4 as uuidv4 } from "uuid";

interface StepFourProps {
  contractData: DatosContrato;
}
const HOST = process.env.NEXT_PUBLIC_API_URL;
const StepFour: React.FC<StepFourProps> = ({ contractData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/api/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });
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
      // Create a link element to initiate the download
      const link = document.createElement("a");
      link.href = data.url;
      link.setAttribute("download", `${data.url}.pdf`);
      link.setAttribute("target", "_blank");

      // Append the link to the body and click it programmatically
      document.body.appendChild(link);
      link.click();

      // Clean up
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
    <div className="step">
      <p>Tu contrato se ha enviado y procesado correctamente</p>
      <button onClick={handleDownload} disabled={isLoading}>
        {isLoading ? "Descargando PDF..." : "Descargar contrato"}
      </button>
    </div>
  );
};

export default StepFour;
