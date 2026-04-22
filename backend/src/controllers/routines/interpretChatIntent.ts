import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { ChatIntentRequest } from "@backend/types/routine";
import {
  isMissingGoogleApiKeyError,
  readGoogleApiKeyFromRequest,
} from "./googleApiKey";

export const interpretChatIntent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const request: ChatIntentRequest = req.body;

    if (!request?.text || !request.text.trim()) {
      res.status(400).json({
        error: "Missing required data: text is required.",
      });
      return;
    }

    const googleApiKey = readGoogleApiKeyFromRequest(req);
    const ragService = getRagService(googleApiKey);
    const intentResult = await ragService.interpretChatIntent(request);

    res.status(200).json(intentResult);
  } catch (error) {
    if (isMissingGoogleApiKeyError(error)) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Missing Google API key.",
      });
      return;
    }

    console.error("Error in interpretChatIntent controller:", error);
    res.status(500).json({
      error: "Internal server error while interpreting chat intent.",
    });
  }
};
