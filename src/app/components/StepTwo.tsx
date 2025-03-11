"use client";
import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { DatosContrato } from "../types";
import { Button } from "@/components/ui/button";
interface StepTwoProps {
  contractData: DatosContrato;
  handleSignature: (signatureDataURL: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const StepTwo: React.FC<StepTwoProps> = ({
  contractData,
  handleSignature,
  nextStep,
  prevStep,
}) => {
  // const opciones = {
  //   weekday: "long",
  //   year: "numeric",
  //   month: "long",
  //   day: "numeric",
  // };
  const signaturePad = useRef<SignaturePad>(null);

  const handleClear = () => {
    signaturePad.current?.clear();
  };

  const handleNext = () => {
    if (signaturePad.current) {
      const signatureDataURL = signaturePad.current.toDataURL();
      handleSignature(signatureDataURL);
      nextStep();
    }
  };
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="step">
      <div className="contract-text">
        <p>
          POR UNA PARTE, FUNDACIÓN ALTIUS ESPAÑA, CON CIF G-83317610 Y SEDE
          SOCIAL EN RONDA DE SEGOVIA 34, 28005 MADRID, SE COMPROMETE A
        </p>
        :
        <ul>
          <li>
            Ofrecer al voluntario la información, formación, apoyo y en su caso
            los medios materiales necesarios para el ejercicio de las funciones
            que se le asignen.
          </li>
          <li>
            Favorecer la participación activa del voluntario en la organización,
            diseño, evaluación y programación de las actividades que realiza.
          </li>
          <li>
            Asegurar al voluntario contra los riesgos de accidente y
            responsabilidad civil derivados del ejercicio de la actividad.
          </li>
          <li>
            Compensar económicamente por los gastos derivados de su actividad
            como voluntario (gastos de gestiones de la Fundación, logística 1KA,
            reuniones, viajes por proyectos, etc… no incluye el desplazamiento
            de domicilio a Altius y regreso)
          </li>
        </ul>
        <p>
          POR LA OTRA PARTE, {contractData.nombre}, con número de identificación{" "}
          {contractData.id}, se compromete a:
        </p>
        <ul>
          <li>
            Cumplir con los compromisos adquiridos con la organización,
            respetando los fines y su normativa.
          </li>
          <li>
            Guardar confidencialidad de la información recibida en el desarrollo
            de su actividad (es necesario firmar documento adjunto en
            cumplimento de la Ley LOPDGDD).
          </li>
          <li>Rechazar cualquier contraprestación material o económica</li>
          <li>
            Respetar los derechos de los beneficiarios y actuar de forma
            diligente y solidaria.
          </li>
        </ul>
        <p>
          En {contractData.lugar}, a {fecha}.
        </p>
        {/* Add more contract text here */}
      </div>
      <div>
        <label>Firma:</label>
        <SignaturePad
          ref={signaturePad}
          canvasProps={{
            className: "signature-canvas",
            style: { width: "100%", height: "200px", border: "1px solid #000" },
          }}
        />
      </div>
      <div className="buttons">
        <div className="flex md:justify-center w-full">
          <Button
            onClick={handleClear}
            className="w-full md:max-w-[150px] flex "
          >
            Reiniciar firma
          </Button>
        </div>
        <br />
        <br />
        <div className="w-full gap-1 flex justify-between ">
          <Button
            onClick={prevStep}
            variant="outline"
            className="flex flex-1 max-w-[84px]  md:max-w-[100px] "
          >
            {"<"} Volver
          </Button>
          <Button
            onClick={handleNext}
            variant="outline"
            className="flex flex-1 max-w-[84px] md:max-w-[100px]"
          >
            Siguiente {">"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepTwo;
