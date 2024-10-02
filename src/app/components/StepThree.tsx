import React from "react";
import { DatosContrato } from "../types";
import Link from "next/link";

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
    <div className="step">
      <p>
        <span style={{ color: "red" }}>*</span> indica campo obligatorio
      </p>

      <div className="flex">
        <input
          type="checkbox"
          id="datos"
          name="derechoDatos"
          onChange={handleInputChange}
          checked={contractData.derechoDatos}
        />
        <label htmlFor="datos">
          Acepto la{" "}
          <Link href="/datos" target="_blank">
            autorización para tratamiento de datos
          </Link>{" "}
          <span style={{ color: "red" }}>*</span>
        </label>
      </div>
      <div className="flex">
        <input
          type="checkbox"
          id="confidencialidad"
          name="derechoConfidencialidad"
          checked={contractData.derechoConfidencialidad}
          onChange={handleInputChange}
        />
        <label htmlFor="confidencialidad">
          Acepto la{" "}
          <Link href="/confidencialidad" target="_blank">
            autorización de confidencialidad
          </Link>{" "}
          <span style={{ color: "red" }}>*</span>
        </label>
      </div>
      <div className="flex">
        <input
          type="checkbox"
          id="imagen"
          name="derechoImagen"
          checked={contractData.derechoImagen}
          onChange={handleInputChange}
        />
        <label htmlFor="imagen">
          Acepto la{" "}
          <Link href="/imagen" target="_blank">
            cesión de derechos de imagen
          </Link>
        </label>
      </div>
      <div className="buttons">
        <button onClick={prevStep}>{"<"} Volver</button>
        <button onClick={handleSubmit}>Enviar contrato</button>
      </div>
    </div>
  );
};

export default StepThree;
