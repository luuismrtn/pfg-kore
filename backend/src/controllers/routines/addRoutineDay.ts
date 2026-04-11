import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { AddRoutineDayRequest } from "@backend/types/routine";

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

    const routine = getRagService();
    const updatedRoutine = await routine.addRoutineDay(request);

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error("Error in addRoutineDay controller:", error);
    res.status(500).json({
      error: "Internal server error while adding one routine day.",
    });
  }
};