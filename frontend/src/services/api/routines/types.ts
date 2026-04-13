import type { RoutineResponse } from "@/features/routine/types";

export type ApiErrorBody = {
  error?: string;
};

export type RoutineProfilePayload = {
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
};

export type ChangeRoutineDayPayload = {
  routine: RoutineResponse;
  dayToChange: string;
  profile?: RoutineProfilePayload;
  changeRequest?: string;
};

export type ChangeRoutineExercisePayload = {
  routine: RoutineResponse;
  dayToChange: string;
  exerciseToChange: string;
  profile?: RoutineProfilePayload;
  changeRequest?: string;
};

export type AddRoutineDayPayload = {
  routine: RoutineResponse;
  profile?: RoutineProfilePayload;
  changeRequest?: string;
};

export type ChatIntentPayload = {
  text: string;
  routine?: RoutineResponse;
};
