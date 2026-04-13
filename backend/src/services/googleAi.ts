import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GOOGLE_CHAT_MODEL = "gemini-3.1-flash-lite-preview";
export const DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
];
export const DEFAULT_GOOGLE_EMBEDDING_MODEL = "text-embedding-001";
export const DEFAULT_GOOGLE_MODEL_TIMEOUT_MS = 45000;

export function createGoogleAiClient(
  apiKey = process.env.GOOGLE_API_KEY,
): GoogleGenAI {
  if (!apiKey) {
    throw new Error(
      "Missing GOOGLE_API_KEY. Add it to backend/.env to use Google AI.",
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
