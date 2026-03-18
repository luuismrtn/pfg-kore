import { Router } from "express";
import { generateRoutine } from "@backend/controllers/routineController";

const router = Router();

router.post("/generate", generateRoutine);

export default router;
