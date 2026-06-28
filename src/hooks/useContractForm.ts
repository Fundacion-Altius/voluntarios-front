'use client';

import { useState } from 'react';
import { AreasT, DatosContrato, ModalidadT } from '@/app/types';
import { todayToSQL } from '@/app/utils';
import { apiPost } from '@/app/lib/csrf';

export function useContractForm() {
  const [step, setStep] = useState(1);
  const [datosContrato, setDatosContrato] = useState<DatosContrato>({
    nombre: '',
    id: '',
    fecha: todayToSQL(),
    domicilio: '',
    empresa: '',
    adulto: 'SI',
    telefono: '',
    areas: [],
    duracion: 'años',
    modalidad: [],
    lugar: '',
    firma: '',
    derechoDatos: false,
    derechoImagen: false,
    derechoConfidencialidad: false,
    horario: '',
    email: '',
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleRadioChange = (name: string, value: string) => {
    if (name === 'modalidad') {
      setDatosContrato((prev) => ({ ...prev, modalidad: [value] as ModalidadT[] }));
    } else {
      setDatosContrato((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (e.type !== 'select') {
      const { name, value, type } = e.target;
      if (type !== 'checkbox') {
        return setDatosContrato((prev) => ({ ...prev, [name]: value }));
      }
      if (type === 'checkbox') {
        const { checked } = e.target;
        if (name === 'areas') {
          setDatosContrato((prev) => {
            const newAreas = checked
              ? ([...prev.areas, value] as AreasT[])
              : (prev.areas.filter((area) => area !== value) as AreasT[]);
            return { ...prev, areas: newAreas };
          });
        } else if (name === 'modalidad') {
          setDatosContrato((prev) => {
            const newModalidad = checked
              ? ([...prev.modalidad, value] as ModalidadT[])
              : (prev.modalidad.filter((mod) => mod !== value) as ModalidadT[]);
            return { ...prev, modalidad: newModalidad };
          });
        } else {
          setDatosContrato((prev) => ({ ...prev, [name]: checked }));
        }
      }
    }
  };

  const handleSignature = (signatureDataURL: string) => {
    setDatosContrato((prev) => ({ ...prev, firma: signatureDataURL }));
  };

  const handleSubmit = async () => {
    const response = await apiPost('/api/contracts', datosContrato);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    nextStep();
  };

  return {
    step,
    datosContrato,
    setDatosContrato,
    nextStep,
    prevStep,
    handleRadioChange,
    handleInputChange,
    handleSignature,
    handleSubmit,
  };
}
