import { Router } from "express";
import {
  changeRoutineExercise,
  changeRoutineDay,
  generateRoutine,
} from "@backend/controllers/routineController";

const router = Router();

router.post("/generate", generateRoutine);
router.post("/change-day", changeRoutineDay);
router.post("/cambiar-ejercicio-rutina", changeRoutineExercise);

export default router;
