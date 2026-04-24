import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { ChangeRoutineDayRequest } from "@backend/types/routine";
import {
  getErrorResponseDetails,
  isMissingGoogleApiKeyError,
  readGoogleApiKeyFromRequest,
} from "./googleApiKey";

export const changeRoutineDay = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const request: ChangeRoutineDayRequest = req.body;

    if (!request?.routine || !request?.dayToChange) {
      res.status(400).json({
        error: "Missing required data: routine and dayToChange are required.",
      });
      return;
    }

    const googleApiKey = readGoogleApiKeyFromRequest(req);
    const ragService = getRagService(googleApiKey);
    const updatedRoutine = await ragService.changeRoutineDay(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    const { statusCode, message } = getErrorResponseDetails(
      error,
      isMissingGoogleApiKeyError(error)
        ? "Missing Google API key."
        : "Internal server error while changing the routine day.",
      isMissingGoogleApiKeyError(error) ? 400 : 500,
    );

    if (statusCode >= 500) {
      console.error("Error in changeRoutineDay controller:", error);
    }

    res.status(statusCode).json({
      error: message,
    });
  }
};
