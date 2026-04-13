import { getJson } from "./shared";

const FALLBACK_SPORT_OPTIONS = [
  "Musculación",
  "Calistenia",
  "Running",
  "Movilidad",
  "Cardio Funcional",
];

function normalizeSportOptions(options: unknown): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  const normalized = new Set<string>();

  for (const option of options) {
    if (typeof option !== "string") {
      continue;
    }

    const trimmed = option.trim();
    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  }

  return Array.from(normalized);
}

export async function getAvailableSportOptions(): Promise<string[]> {
  try {
    const options = await getJson<unknown>(
      "/api/routines/modalidades",
      "No se pudieron cargar las modalidades disponibles.",
    );

    const normalized = normalizeSportOptions(options);
    return normalized.length > 0 ? normalized : FALLBACK_SPORT_OPTIONS;
  } catch (error) {
    console.error("Failed to load sport options:", error);
    return FALLBACK_SPORT_OPTIONS;
  }
}
