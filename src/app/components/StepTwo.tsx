"use client";
import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { DatosContrato } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
    <Card className="step">
      <CardContent className="space-y-6">
        <div className="contract-text">
          <p>
            POR UNA PARTE, FUNDACIÓN ALTIUS ESPAÑA, CON CIF G-83317610 Y SEDE
            SOCIAL EN RONDA DE SEGOVIA 34, 28005 MADRID, SE COMPROMETE A:
            <ul>
              <li>
                Ofrecer al voluntario la información, formación, apoyo y en su
                caso los medios materiales necesarios para el ejercicio de las
                funciones que se le asignen.
              </li>
              <li>
                Favorecer la participación activa del voluntario en la
                organización, diseño, evaluación y programación de las actividades
                que realiza.
              </li>
              <li>
                Asegurar al voluntario contra los riesgos de accidente y
                responsabilidad civil derivados del ejercicio de la actividad.
              </li>
              <li>
                Compensar económicamente por los gastos derivados de su actividad
                como voluntario (gastos de gestiones de la Fundación, logística
                1KA, reuniones, viajes por proyectos, etc… no incluye el
                desplazamiento de domicilio a Altius y regreso)
              </li>
            </ul>
            <p>
              POR LA OTRA PARTE, {contractData.nombre}, con número de
              identificación {contractData.id}, se compromete a:
            </p>
            <ul>
              <li>
                Cumplir con los compromisos adquiridos con la organización,
                respetando los fines y su normativa.
              </li>
              <li>
                Guardar confidencialidad de la información recibida en el
                desarrollo de su actividad (es necesario firmar documento adjunto
                en cumplimento de la Ley LOPDGDD).
              </li>
              <li>Rechazar cualquier contraprestación material o económica</li>
              <li>
                Respetar los derechos de los beneficiarios y actuar de forma
                diligente y solidaria.
              </li>
            </ul>
            En {contractData.lugar}, a {fecha}.
          </p>
        </div>
        <div>
          <Label>Firma:</Label>
          <SignaturePad
            ref={signaturePad}
            canvasProps={{
              className: "signature-canvas",
              style: { width: "100%", height: "200px", border: "1px solid #000" },
            }}
          />
        </div>
        <div className="buttons">
          <Button onClick={handleClear}>Reiniciar firma</Button>
          <br />
          <br />
          <Button variant="outline" onClick={prevStep}>{"<"} Volver</Button>
          <Button onClick={handleNext}>Siguiente {">"}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepTwo;
