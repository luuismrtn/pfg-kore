import type { Request, Response } from "express";
import { RagService } from "@backend/services/ragService";
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
