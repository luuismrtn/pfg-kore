export interface RoutineRequest {
  text: string;
  name: string;
  weightKg: number | "";
  heightCm: number | "";
  sport: string;
  availableDays: number;
  averageDurationMinutes: number;
  equipment: string[];
  injuries: string[];
  level: string;
}

export interface RoutineExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  note?: string;
  badges?: string[];
}

export interface RoutineDay {
  day: string;
  exercises: RoutineExercise[];
}

export interface RoutineResponse {
  routine: RoutineDay[];
}
