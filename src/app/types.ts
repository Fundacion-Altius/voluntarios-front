export type AdultT = "SI" | "NO"
export type AreasT =
  | "Reparto de Alimentos"
  | "Acompañamiento en la búsqueda de empleo"
  | "Coaching"
  | "Formación"
  | "CEPI"
  | "Nave"
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

export interface Question {
  id: number;
  text: string;
  surveyID: number;
  created_at?: string;
}

export interface SurveySubmission {
  surveyID: number;
  ratings: { [questionId: number]: number };
  additionalAnswer?: string;
}

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
