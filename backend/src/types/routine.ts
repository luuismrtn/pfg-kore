export type UserGender = "mujer" | "hombre" | "otro" | "prefiero no decirlo";

export interface RoutineRequest {
  text: string;
  name: string;
  weightKg: number | "";
  heightCm: number | "";
  age: number | "";
  gender: UserGender;
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
  intensity: number;
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

export interface ChangeRoutineDayRequest {
  routine: RoutineResponse;
  dayToChange: string;
  profile?: Partial<RoutineRequest>;
  changeRequest?: string;
}

export interface ChangeRoutineExerciseRequest {
  routine: RoutineResponse;
  dayToChange: string;
  exerciseToChange: string;
  profile?: Partial<RoutineRequest>;
  changeRequest?: string;
}

export interface AddRoutineDayRequest {
  routine: RoutineResponse;
  profile?: Partial<RoutineRequest>;
  changeRequest?: string;
}

export type ChatIntentAction =
  | "create_routine"
  | "change_exercise"
  | "change_day"
  | "add_day"
  | "question";

export interface ChatIntentRequest {
  text: string;
  routine?: RoutineResponse;
  profile?: Partial<RoutineRequest>;
}

export interface ChatIntentResponse {
  action: ChatIntentAction;
  responseText: string;
  dayToChange?: string;
  exerciseToChange?: string;
}
