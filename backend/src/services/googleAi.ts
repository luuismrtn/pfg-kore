import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GOOGLE_CHAT_MODEL = "gemini-3.5-flash";
export const DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemma-4-31b-it",
  "gemini-2.5-pro",
  "gemini-2.5-flash"
];
export const DEFAULT_GOOGLE_EMBEDDING_MODEL = "gemini-embedding-2-preview";
export const DEFAULT_GOOGLE_MODEL_TIMEOUT_MS = 45000;

export function createGoogleAiClient(
  apiKey?: string,
): GoogleGenAI {
  if (!apiKey) {
    throw new Error(
      "Missing Google API key. Configure it in Settings.",
    );
  }

  return new GoogleGenAI({ apiKey });
}

export function resolveUniqueModels(
  primary: string | undefined,
  fallbacks: string[],
): string[] {
  return [primary, ...fallbacks].filter(
    (model, index, models): model is string =>
      typeof model === "string" &&
      model.trim().length > 0 &&
      models.indexOf(model) === index,
  );
}
