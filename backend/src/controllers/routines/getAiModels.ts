import type { Request, Response } from "express";
import {
  DEFAULT_GOOGLE_CHAT_MODEL,
  DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS,
  DEFAULT_GOOGLE_EMBEDDING_MODEL,
  resolveUniqueModels,
} from "@backend/services/googleAi";

export const getAiModels = (_req: Request, res: Response): void => {
  const responseModels = resolveUniqueModels(
    DEFAULT_GOOGLE_CHAT_MODEL,
    DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS,
  );

  res.status(200).json({
    responseModel: DEFAULT_GOOGLE_CHAT_MODEL,
    responseModelFallbacks: responseModels.slice(1),
    embeddingModel: DEFAULT_GOOGLE_EMBEDDING_MODEL,
  });
};
