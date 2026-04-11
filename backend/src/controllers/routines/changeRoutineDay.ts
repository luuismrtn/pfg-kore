import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { ChangeRoutineDayRequest } from "@backend/types/routine";

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

    const routine = getRagService();
    const updatedRoutine = await routine.changeRoutineDay(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Error in changeRoutineDay controller:", error);
    res.status(500).json({
      error: "Internal server error while changing the routine day.",
    });
  }
};