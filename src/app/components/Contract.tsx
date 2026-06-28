"use client";
import React from "react";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import Image from "next/image";
import { useContractForm } from "@/hooks/useContractForm";

const imagePrefix = `${process.env.NEXT_PUBLIC_IMAGE_PREFIX}`;
const Contract: React.FC = () => {
  const {
    step,
    datosContrato,
    nextStep,
    prevStep,
    handleRadioChange,
    handleInputChange,
    handleSignature,
    handleSubmit,
  } = useContractForm();

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepOne
            contractData={datosContrato}
            setDatosContrato={() => {}}
            handleInputChange={handleInputChange}
            handleRadioChange={handleRadioChange}
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
