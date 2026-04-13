import type { RoutineResponse } from "@/features/routine/types";
import type { AddRoutineDayPayload } from "./types";
import { buildRoutineRequestPayload, getProfile, postJson } from "./shared";

export async function addRoutineDay(
  routine: RoutineResponse,
  changeRequest = "",
): Promise<RoutineResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const requestPayload: AddRoutineDayPayload = {
    routine,
    profile: profilePayload ?? undefined,
    changeRequest: changeRequest.trim() || undefined,
  };

  return postJson<RoutineResponse>(
    "/api/routines/add-day",
    requestPayload,
    "No se pudo añadir un día más a la rutina.",
  );
}
