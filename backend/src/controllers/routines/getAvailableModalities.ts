import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../../data/musculacion.json");

type ExerciseCatalogEntry = {
  modalidad?: unknown;
};

function normalizeModalityKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractModalities(records: ExerciseCatalogEntry[]): string[] {
  const modalities = new Map<string, string>();

  for (const record of records) {
    const modality =
      typeof record.modalidad === "string" ? record.modalidad.trim() : "";

    if (!modality) {
      continue;
    }

    const key = normalizeModalityKey(modality);
    if (!modalities.has(key)) {
      modalities.set(key, modality);
    }
  }

  return Array.from(modalities.values());
}

export const getAvailableModalities = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(rawData) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("Exercise catalog is not an array.");
    }

    const modalities = extractModalities(parsed as ExerciseCatalogEntry[]);
    res.status(200).json(modalities);
  } catch (error) {
    console.error("Error in getAvailableModalities controller:", error);
    res.status(500).json({
      error: "Internal server error while loading available modalities.",
    });
  }
};
