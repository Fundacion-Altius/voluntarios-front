"use client";
import React, { useState } from "react";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import { AreasT, DatosContrato, ModalidadT } from "../types";
import Image from "next/image";
import { todayToSQL } from "../utils";
const HOST = process.env.NEXT_PUBLIC_API_URL;

const imagePrefix = `${process.env.NEXT_PUBLIC_IMAGE_PREFIX}`;
const Contract: React.FC = () => {
  const [step, setStep] = useState(1);

  const [datosContrato, setDatosContrato] = useState<DatosContrato>({
    nombre: "",
    id: "",
    fecha: todayToSQL(),
    domicilio: "",
    empresa: "",
    adulto: "SI",
    telefono: "",
    areas: [],
    duracion: "años",
    modalidad: [],
    lugar: "",
    firma: "",
    derechoDatos: false,
    derechoImagen: false,
    derechoConfidencialidad: false,
    horario: "",
    email: "",
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // if not select type
    if (e.type !== "select") {
      const { name, value, type } = e.target;
      if (type !== "checkbox") {
        return setDatosContrato({ ...datosContrato, [name]: value });
      }
      if (type === "checkbox") {
        const { checked } = e.target;
        if (name === "areas") {
          const newAreas = checked
            ? ([...datosContrato.areas, value] as AreasT[])
            : (datosContrato.areas.filter(
                (area) => area !== value
              ) as AreasT[]);
          setDatosContrato({ ...datosContrato, areas: newAreas });
        } else if (name === "modalidad") {
          const newModalidad = checked
            ? ([...datosContrato.modalidad, value] as ModalidadT[])
            : (datosContrato.modalidad.filter(
                (mod) => mod !== value
              ) as ModalidadT[]);
          setDatosContrato({ ...datosContrato, modalidad: newModalidad });
        } else {
          setDatosContrato({ ...datosContrato, [name]: checked });
        }
      }
    }
    // } else if (name === "duracion" && value === "otros") {
    //   setDatosContrato({ ...datosContrato, duracion: "" });
    // }
  };

  const handleSignature = (signatureDataURL: string) => {
    setDatosContrato((prevData) => ({
      ...prevData,
      firma: signatureDataURL,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${HOST}/api/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosContrato),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log({ data });
      nextStep();
    } catch (error) {
      console.error("Error submitting contract:", error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepOne
            contractData={datosContrato}
            setDatosContrato={setDatosContrato}
            handleInputChange={handleInputChange}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <StepTwo
            contractData={datosContrato}
            handleSignature={handleSignature}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <StepThree
            contractData={datosContrato}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            prevStep={prevStep}
          />
        );
      case 4:
        return <StepFour contractData={datosContrato} />;
      default:
        return null;
    }
  };

  return (
    <main>
      <Image
        alt="logo"
        src={`${imagePrefix}logo.png`}
        width={400}
        height={100}
        className="logo"
        priority
      />
      <div className="contract-wizard">
        <h2>Acuerdo de voluntariado con la Fundación Altius</h2>
        {renderStep()}
      </div>
    </main>
  );
};

export default Contract;
