// Shared application types

export type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type OutputFormat = {
  message: string;
  suggestions: string[];
};

export type Turno = {
  id: number;
  created_at: string;
  paciente: string | null;
  info: unknown;
  // Dates and times use string formats to align with DB values and URL params
  date: string; // YYYY-MM-DD
  time: string; // HH:MM[:SS]
};

export type PatchBody = {
  atendido?: boolean;
};

export type NewPaciente = {
  nombre: string;
  prioridad: number; // 1..5
};

export type PacienteRel = {
  id: number;
  nombre: string;
  prioridad: number;
  hora_llegada: string;
  atendido: boolean;
};

export type DoctorWithCurrent = {
  id: number;
  nombre: string;
  especialidad: string;
  ocupado: boolean;
  currentPaciente: null | {
    id: number;
    nombre: string;
    prioridad: number;
    hora_llegada: string;
    asignacion_id: number;
    hora_asignacion: string;
  };
};

export type PacienteRow = { id: number; atendido: boolean };

export type AsignacionRow = {
  id: number;
  paciente_id: number;
  hora_asignacion: string;
  pacientes?: PacienteRow | PacienteRow[] | null;
} | null;


export type NextQuestionPayload = { message?: string; suggestions?: string[] };
export type GenerateTextResult<T> = { text: string; object?: T | null };