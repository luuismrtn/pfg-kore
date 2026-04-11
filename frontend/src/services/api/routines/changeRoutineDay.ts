import type { RoutineResponse } from "@/features/routine/types";
import type { ChangeRoutineDayPayload } from "./types";
import { buildRoutineRequestPayload, getProfile, postJson } from "./shared";

export async function changeRoutineDay(
  routine: RoutineResponse,
  dayToChange: string,
  changeRequest = "",
): Promise<RoutineResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const requestPayload: ChangeRoutineDayPayload = {
    routine,
    dayToChange,
    profile: profilePayload ?? undefined,
    changeRequest: changeRequest.trim() || undefined,
  };

  return postJson<RoutineResponse>(
    "/api/routines/change-day",
    requestPayload,
    "No se pudo regenerar el dia.",
  );
}