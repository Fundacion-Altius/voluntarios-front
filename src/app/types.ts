export type AdultT = "SI" | "NO";
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
  email: string;
}
export interface Question {
  id: number;
  createdAt: Date;
  text: string;
  surveyID: number;
}
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};
export type LoginPayload = Omit<RegisterPayload, "name">;
export interface Contract {
  nombre: string;
  fecha: Date;
  id: string;
  domicilio: string;
  empresa?: string;
  adulto: AdultT;
  telefono: string;
  areas: AreasT[];
  duracion?: DuracionT;
  modalidad: ModalidadT[];
  lugar: string;
  derechoDatos: boolean;
  derechoImagen: boolean;
  derechoConfidencialidad: boolean;
  horario: string;
  email: string;
}
