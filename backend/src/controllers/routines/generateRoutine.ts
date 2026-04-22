import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { RoutineRequest, UserGender } from "@backend/types/routine";
import {
  isMissingGoogleApiKeyError,
  readGoogleApiKeyFromRequest,
} from "./googleApiKey";

const ALLOWED_GENDERS = new Set<UserGender>([
  "mujer",
  "hombre",
  "otro",
  "prefiero no decirlo",
]);

export const generateRoutine = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const request: RoutineRequest = req.body;

    if (!request) {
      res.status(400).json({ error: "Missing required profile data." });
      return;
    }

    if (typeof request.age !== "number" || request.age < 16) {
      res.status(400).json({
        error: "Age must be a number greater than or equal to 16.",
      });
      return;
    }

    if (!ALLOWED_GENDERS.has(request.gender)) {
      res.status(400).json({
        error:
          "Invalid gender value. Allowed values: mujer, hombre, otro, prefiero no decirlo.",
      });
      return;
    }

    const googleApiKey = readGoogleApiKeyFromRequest(req);
    const ragService = getRagService(googleApiKey);
    const generatedRoutine = await ragService.generateRoutine(request);

    res.status(200).json(generatedRoutine);
  } catch (error) {
    if (isMissingGoogleApiKeyError(error)) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Missing Google API key.",
      });
      return;
    }

    console.error("Error in generateRoutine controller:", error);
    res.status(500).json({
      error: "Internal server error while processing the routine.",
    });
  }
};
