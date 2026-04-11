import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { ChangeRoutineExerciseRequest } from "@backend/types/routine";

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

    const routine = getRagService();
    const updatedRoutine = await routine.changeRoutineExercise(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Error in changeRoutineExercise controller:", error);
    res.status(500).json({
      error: "Internal server error while changing one routine exercise.",
    });
  }
};