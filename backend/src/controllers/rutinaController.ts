import type { Request, Response } from "express";
import { RagService, type PerfilUsuario } from "../services/ragService.ts";

export const generarRutina = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const perfil: PerfilUsuario = req.body;

    if (!perfil || !perfil.objetivo || !perfil.nivel) {
      res
        .status(400)
        .json({ error: "Faltan datos obligatorios en el perfil." });
      return;
    }

    const ragService = new RagService();
    const rutina = await ragService.generarRutina(perfil);

    res.status(200).json(rutina);
  } catch (error) {
    console.error("Error en rutinaController:", error);
    res.status(500).json({
      error: "Error interno del servidor al procesar la rutina.",
    });
  }
};
