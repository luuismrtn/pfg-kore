import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { AddRoutineDayRequest } from "@backend/types/routine";
import {
  getErrorResponseDetails,
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
    const { statusCode, message } = getErrorResponseDetails(
      error,
      isMissingGoogleApiKeyError(error)
        ? "Missing Google API key."
        : "Internal server error while adding one routine day.",
      isMissingGoogleApiKeyError(error) ? 400 : 500,
    );

    if (statusCode >= 500) {
      console.error("Error in addRoutineDay controller:", error);
    }

    res.status(statusCode).json({
      error: message,
    });
  }
};
