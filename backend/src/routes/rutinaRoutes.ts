import { Router } from "express";
import { generarRutina } from "../controllers/rutinaController";

const router = Router();

router.post("/generar", generarRutina);

export default router;
