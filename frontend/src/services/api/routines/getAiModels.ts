import { getJson } from "./shared";
import type { AiModelsResponse } from "./types";

const AI_MODELS_FALLBACK_ERROR =
  "No se pudo cargar la configuración de modelos de IA.";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeAiModelsResponse(value: unknown): AiModelsResponse {
  if (!value || typeof value !== "object") {
    throw new Error(AI_MODELS_FALLBACK_ERROR);
  }

  const candidate = value as Partial<AiModelsResponse>;
  const responseModel =
    typeof candidate.responseModel === "string"
      ? candidate.responseModel.trim()
      : "";
  const embeddingModel =
    typeof candidate.embeddingModel === "string"
      ? candidate.embeddingModel.trim()
      : "";

  if (!responseModel || !embeddingModel) {
    throw new Error(AI_MODELS_FALLBACK_ERROR);
  }

  return {
    responseModel,
    responseModelFallbacks: normalizeStringArray(
      candidate.responseModelFallbacks,
    ),
    embeddingModel,
  };
}

export async function getAiModels(): Promise<AiModelsResponse> {
  const data = await getJson<unknown>(
    "/api/routines/ai-models",
    AI_MODELS_FALLBACK_ERROR,
  );

  return normalizeAiModelsResponse(data);
}
