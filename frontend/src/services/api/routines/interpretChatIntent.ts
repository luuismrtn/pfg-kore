import type { ChatIntentResponse } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import type { ChatIntentPayload } from "./types";
import { postJson } from "./shared";

export async function interpretChatIntent(
  text: string,
  routine?: RoutineResponse,
): Promise<ChatIntentResponse> {
  const payload: ChatIntentPayload = {
    text,
    routine,
  };

  return postJson<ChatIntentResponse>(
    "/api/routines/chat-intent",
    payload,
    "No se pudo interpretar tu mensaje.",
  );
}
