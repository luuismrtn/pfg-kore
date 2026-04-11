import type { RoutineResponse } from "@/features/routine/types";
import {
  buildRoutineRequestPayload,
  getProfile,
  getRoutineGenerationProfileError,
  INCOMPLETE_PROFILE_ERROR_MESSAGE,
  postJson,
} from "./shared";

export async function generateRoutine(text: string): Promise<RoutineResponse> {
  const profile = getProfile();
  const profileError = getRoutineGenerationProfileError(profile);

  if (profileError) {
    throw new Error(profileError);
  }

  const requestPayload = buildRoutineRequestPayload(profile, text);

  if (!requestPayload) {
    throw new Error(INCOMPLETE_PROFILE_ERROR_MESSAGE);
  }

  return postJson<RoutineResponse>(
    "/api/routines/generate",
    requestPayload,
    "No se pudo generar la rutina.",
  );
}