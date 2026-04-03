import { Router } from "express";
import {
  addRoutineDay,
  changeRoutineExercise,
  changeRoutineDay,
  generateRoutine,
  interpretChatIntent,
} from "@backend/controllers/routineController";

const router = Router();

router.post("/generate", generateRoutine);
router.post("/change-day", changeRoutineDay);
router.post("/cambiar-ejercicio-rutina", changeRoutineExercise);
router.post("/add-day", addRoutineDay);
router.post("/chat-intent", interpretChatIntent);

export default router;
