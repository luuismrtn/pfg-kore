import type { ChatIntentResponse } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import type { ChatIntentPayload } from "./types";
import { buildRoutineRequestPayload, getProfile, postJson } from "./shared";

export async function interpretChatIntent(
  text: string,
  routine?: RoutineResponse,
): Promise<ChatIntentResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const payload: ChatIntentPayload = {
    text,
    routine,
    profile: profilePayload ?? undefined,
  };

  return postJson<ChatIntentResponse>(
    "/api/routines/chat-intent",
    payload,
    "No se pudo interpretar tu mensaje.",
  );
}
