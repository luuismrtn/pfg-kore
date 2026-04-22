import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { AddRoutineDayRequest } from "@backend/types/routine";
import {
  isMissingGoogleApiKeyError,
  readGoogleApiKeyFromRequest,
} from "./googleApiKey";

export const addRoutineDay = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const request: AddRoutineDayRequest = req.body;

    if (!request?.routine) {
      res.status(400).json({
        error: "Missing required data: routine is required.",
      });
      return;
    }

    const googleApiKey = readGoogleApiKeyFromRequest(req);
    const ragService = getRagService(googleApiKey);
    const updatedRoutine = await ragService.addRoutineDay(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    if (isMissingGoogleApiKeyError(error)) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Missing Google API key.",
      });
      return;
    }

    console.error("Error in addRoutineDay controller:", error);
    res.status(500).json({
      error: "Internal server error while adding one routine day.",
    });
  }
};
