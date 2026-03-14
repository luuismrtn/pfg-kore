import { Router } from "express";
import { generarRutina } from "../controllers/rutinaController.ts";

const router = Router();

router.post("/generar", generarRutina);

export default router;
