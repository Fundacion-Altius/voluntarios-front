import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { StepThreeProps } from "./Contract";
import LoadingButton from "@/components/loading-button";



const StepThree: React.FC<StepThreeProps> = ({
  contractData,
  handleInputChange,
  handleSubmit,
  loading,
  prevStep,
}) => {
  return (
    <div className="step">
      <p>
        <span style={{ color: "red" }}>*</span> indica campo obligatorio
      </p>

      <div className="flex items-center">
        <Input
          type="checkbox"
          id="datos"
          name="derechoDatos"
          onChange={handleInputChange}
          checked={contractData.derechoDatos}
          required
        />
        <Label
          htmlFor="datos"
          className="border-b border-dotted border-slate-700"
        >
          Acepto la{" "}
          <Link href="/datos" target="_blank">
            autorización para tratamiento de datos
          </Link>{" "}
          <span style={{ color: "red" }}>*</span>
        </Label>
      </div>
      <div className="flex items-center">
        <Input
          type="checkbox"
          id="confidencialidad"
          name="derechoConfidencialidad"
          checked={contractData.derechoConfidencialidad}
          onChange={handleInputChange}
          required
        />
        <Label
          htmlFor="confidencialidad"
          className="border-b border-dotted border-slate-700"
        >
          Acepto la{" "}
          <Link href="/confidencialidad" target="_blank">
            autorización de confidencialidad
          </Link>{" "}
          <span style={{ color: "red" }}>*</span>
        </Label>
      </div>
      <div className="flex items-center">
        <Input
          type="checkbox"
          id="imagen"
          name="derechoImagen"
          checked={contractData.derechoImagen}
          onChange={handleInputChange}
        />
        <Label
          htmlFor="imagen"
          className="border-b border-dotted border-slate-700"
        >
          Acepto la{" "}
          <Link href="/imagen" target="_blank">
            cesión de derechos de imagen
          </Link>
        </Label>
      </div>
      <div className="flex flex-col md:flex-row w-full gap-2 mt-8 justify-between">
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex flex-1 order-2 md:order-1 md:max-w-[100px]"
        >
          {"<"} Volver
        </Button>
        <LoadingButton
          isLoading={loading}
          onClick={handleSubmit}
          className="flex flex-1 order-1 md:order-2 md:max-w-[150px]"
        >
          Enviar contrato
        </LoadingButton>
      </div>
    </div>
  );
};

export default StepThree;
