'use client';

import { useState } from 'react';
import { AreasT, DatosContrato, ModalidadT } from '@/app/types';
import { todayToSQL } from '@/app/utils';
import { apiPost } from '@/app/lib/csrf';

type Result<T> = { success: true; data?: T } | { success: false; error: string };

/** DOM checkbox ids → DatosContrato boolean field names */
const CONSENT_FIELD_BY_ID: Record<string, keyof DatosContrato> = {
  datos: 'derechoDatos',
  confidencialidad: 'derechoConfidencialidad',
  imagen: 'derechoImagen',
};

function toggleValue<T extends string>(list: T[], value: string, checked: boolean): T[] {
  return checked ? ([...list, value] as T[]) : list.filter((item) => item !== value);
}

/** Pure reducer for a checkbox change: list-like fields toggle membership, the rest store the boolean. */
function applyCheckbox(prev: DatosContrato, fieldName: string, value: string, checked: boolean): DatosContrato {
  if (fieldName === 'areas') return { ...prev, areas: toggleValue<AreasT>(prev.areas, value, checked) };
  if (fieldName === 'modalidad') return { ...prev, modalidad: toggleValue<ModalidadT>(prev.modalidad, value, checked) };
  if (fieldName === 'horario') {
    const current = prev.horario ? prev.horario.split(', ') : [];
    const next = checked ? Array.from(new Set([...current, value])) : current.filter((h) => h !== value);
    return { ...prev, horario: next.join(', ') };
  }
  return { ...prev, [fieldName]: checked };
}

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
    if (e.type === 'select') return;
    const { name, value, type, id } = e.target;
    // Prefer name; fall back to id. Map consent checkbox DOM ids → derecho* fields.
    const rawKey = name || id;
    const fieldName = CONSENT_FIELD_BY_ID[rawKey] ?? rawKey;
    if (type !== 'checkbox') {
      return setDatosContrato((prev) => ({ ...prev, [fieldName]: value }));
    }
    const { checked } = e.target;
    setDatosContrato((prev) => applyCheckbox(prev, fieldName, value, checked));
  };

  const handleSignature = (signatureDataURL: string) => {
    setDatosContrato((prev) => ({ ...prev, firma: signatureDataURL }));
  };

  const handleSubmit = async () => {
    if (!datosContrato.derechoDatos || !datosContrato.derechoConfidencialidad || !datosContrato.derechoImagen) {
      throw new Error('Debes aceptar todos los consentimientos obligatorios para enviar el contrato.');
    }
    const response = await apiPost('/api/contracts', datosContrato);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, error: errorData.message || errorData.error || `HTTP error! status: ${response.status}` };
    }
    const data = await response.json();
    if (data.existing) {
      return { success: false as const, error: "No se puede generar dos veces el mismo contrato para el mismo DNI/NIE. Recarga para intentar con otro DNI/NIE" };
    }
    nextStep();
    return { success: true as const };
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

export type UseContractFormReturn = ReturnType<typeof useContractForm>;
