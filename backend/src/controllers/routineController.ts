import type { Request, Response } from "express";
import { RagService } from "@backend/services/ragService";
import type {
  ChangeRoutineExerciseRequest,
  ChangeRoutineDayRequest,
  RoutineRequest,
} from "@backend/types/routine";

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

    const ragService = new RagService();
    const routine = await ragService.generateRoutine(request);

    res.status(200).json(routine);
  } catch (error) {
    console.error("Error in routineController:", error);
    res.status(500).json({
      error: "Internal server error while processing the routine.",
    });
  }
};

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

    const ragService = new RagService();
    const updatedRoutine = await ragService.changeRoutineDay(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Error in changeRoutineDay controller:", error);
    res.status(500).json({
      error: "Internal server error while changing the routine day.",
    });
  }
};

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

    const ragService = new RagService();
    const updatedRoutine = await ragService.changeRoutineExercise(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Error in changeRoutineExercise controller:", error);
    res.status(500).json({
      error: "Internal server error while changing one routine exercise.",
    });
  }
};
