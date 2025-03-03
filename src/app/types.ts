export type AdultT = "SI" | "NO"
export type AreasT =
  | "Reparto de Alimentos"
  | "Acompañamiento en la búsqueda de empleo"
  | "Coaching"
  | "Formación"
  | "CEPI"
  | "Otra"
  | string;
export type DuracionT =
  | "días"
  | "semanas"
  | "meses"
  | "años"
  | "indeterminado"
  | string;
export type ModalidadT = "Presencial" | "Online" | "Híbrido";
export interface DatosContrato {
  nombre: string;
  fecha: string;
  id: string;
  domicilio: string;
  empresa?: string;
  adulto: AdultT;
  telefono: string;
  areas: AreasT[];
  duracion?: DuracionT;
  modalidad: ModalidadT[];
  lugar: string;
  firma: string;
  derechoDatos: boolean;
  derechoImagen: boolean;
  derechoConfidencialidad: boolean;
  horario: string;
  email: string,
}
