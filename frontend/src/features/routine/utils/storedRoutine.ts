import type { RoutineResponse } from "@/features/routine/types";

const ROUTINE_STORAGE_KEY = "pfg-kore:chat:routine";

function isRoutineResponse(value: unknown): value is RoutineResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeRoutine = value as Partial<RoutineResponse>;
  return Array.isArray(maybeRoutine.routine);
}

export function hasStoredRoutineWithExercises(): boolean {
  const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isRoutineResponse(parsed)) {
      return false;
    }

    return parsed.routine.some(
      (day) => Array.isArray(day.exercises) && day.exercises.length > 0,
    );
  } catch {
    return false;
  }
}
