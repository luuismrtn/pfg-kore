import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { ChangeRoutineExerciseRequest } from "@backend/types/routine";
import {
  getErrorResponseDetails,
  isMissingGoogleApiKeyError,
  readGoogleApiKeyFromRequest,
} from "./googleApiKey";

export const changeRoutineExercise = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const request: ChangeRoutineExerciseRequest = req.body;

    if (
      !request?.routine ||
      !request?.dayToChange ||
      !request?.exerciseToChange
    ) {
      res.status(400).json({
        error:
          "Missing required data: routine, dayToChange and exerciseToChange are required.",
      });
      return;
    }

    const googleApiKey = readGoogleApiKeyFromRequest(req);
    const ragService = getRagService(googleApiKey);
    const updatedRoutine = await ragService.changeRoutineExercise(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    const { statusCode, message } = getErrorResponseDetails(
      error,
      isMissingGoogleApiKeyError(error)
        ? "Missing Google API key."
        : "Internal server error while changing one routine exercise.",
      isMissingGoogleApiKeyError(error) ? 400 : 500,
    );

    if (statusCode >= 500) {
      console.error("Error in changeRoutineExercise controller:", error);
    }

    res.status(statusCode).json({
      error: message,
    });
  }
};
