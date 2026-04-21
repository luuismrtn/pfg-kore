import type { ChatIntentResponse } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import type { ChatContextMessage, ChatIntentPayload } from "./types";
import { buildRoutineRequestPayload, getProfile, postJson } from "./shared";

export async function interpretChatIntent(
  text: string,
  routine?: RoutineResponse,
  history?: ChatContextMessage[],
): Promise<ChatIntentResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const payload: ChatIntentPayload = {
    text,
    routine,
    profile: profilePayload ?? undefined,
    history,
  };

  return postJson<ChatIntentResponse>(
    "/api/routines/chat-intent",
    payload,
    "No se pudo interpretar tu mensaje.",
  );
}
