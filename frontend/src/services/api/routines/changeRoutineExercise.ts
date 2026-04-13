import type { RoutineResponse } from "@/features/routine/types";
import type { ChangeRoutineExercisePayload } from "./types";
import { buildRoutineRequestPayload, getProfile, postJson } from "./shared";

export async function changeRoutineExercise(
  routine: RoutineResponse,
  dayToChange: string,
  exerciseToChange: string,
  changeRequest = "",
): Promise<RoutineResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const requestPayload: ChangeRoutineExercisePayload = {
    routine,
    dayToChange,
    exerciseToChange,
    profile: profilePayload ?? undefined,
    changeRequest: changeRequest.trim() || undefined,
  };

  return postJson<RoutineResponse>(
    "/api/routines/cambiar-ejercicio-rutina",
    requestPayload,
    "No se pudo cambiar el ejercicio.",
  );
}
