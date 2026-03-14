export type PerfilUsuario = {
  objetivo: string;
  nivel: string;
  lesiones: string[];
  equipamiento: string[];
  dias_semana: number;
};

export type EjercicioRutina = {
  ejercicio_id: string;
  nombre: string;
  series: number;
  repeticiones: string;
  descanso_segundos: number;
  nota?: string;
};

export type DiaRutina = {
  dia: string;
  ejercicios: EjercicioRutina[];
};

export type RutinaResponse = {
  rutina: DiaRutina[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
