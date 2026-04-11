import type { Request, Response } from "express";
import { getRagService } from "@backend/services/ragServiceInstance";
import type { RoutineRequest } from "@backend/types/routine";

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

    const routine = getRagService();
    const generatedRoutine = await routine.generateRoutine(request);

    res.status(200).json(generatedRoutine);
  } catch (error) {
    console.error("Error in generateRoutine controller:", error);
    res.status(500).json({
      error: "Internal server error while processing the routine.",
    });
  }
};