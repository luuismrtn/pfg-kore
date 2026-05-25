import type { UserGender, UserProfileForm } from "@/features/profile/types";
import type { ApiErrorBody, RoutineProfilePayload } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const PROFILE_STORAGE_KEY = "kore.user-profile.v1";
const GOOGLE_API_KEY_STORAGE_KEY = "kore.google-ai-api-key.v1";
const INCOMPLETE_PROFILE_ERROR_MESSAGE =
  "Completa los datos obligatorios del perfil para generar una rutina.";
const MISSING_GOOGLE_API_KEY_ERROR_MESSAGE =
  "Configura tu Google API Key en Ajustes para usar las funciones de IA.";
const AI_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con la IA. Revisa tu conexión e inténtalo de nuevo.";
const VALID_GENDERS: UserGender[] = [
  "mujer",
  "hombre",
  "otro",
  "prefiero no decirlo",
];

const DEFAULT_PROFILE: UserProfileForm = {
  name: "",
  weightKg: "",
  heightCm: "",
  age: "",
  gender: "prefiero no decirlo",
  sport: "Musculación",
  equipment: [],
  injuries: [],
  availableDays: 3,
  averageDurationMinutes: 60,
  level: "Principiante",
};

function isUserGender(value: unknown): value is UserGender {
  return (
    typeof value === "string" && VALID_GENDERS.includes(value as UserGender)
  );
}

function toValidProfile(value: unknown): UserProfileForm | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<UserProfileForm>;

  const equipment = Array.isArray(candidate.equipment)
    ? candidate.equipment.filter((item) => typeof item === "string")
    : null;
  const injuries = Array.isArray(candidate.injuries)
    ? candidate.injuries.filter((item) => typeof item === "string")
    : null;

  return {
    name: typeof candidate.name === "string" ? candidate.name : "",
    weightKg:
      typeof candidate.weightKg === "number" || candidate.weightKg === ""
        ? candidate.weightKg
        : "",
    heightCm:
      typeof candidate.heightCm === "number" || candidate.heightCm === ""
        ? candidate.heightCm
        : "",
    age:
      typeof candidate.age === "number" || candidate.age === ""
        ? candidate.age
        : "",
    gender: isUserGender(candidate.gender)
      ? candidate.gender
      : "prefiero no decirlo",
    sport:
      typeof candidate.sport === "string" && candidate.sport.length > 0
        ? candidate.sport
        : "Musculación",
    equipment: equipment || [],
    injuries: injuries || [],
    level:
      typeof candidate.level === "string" && candidate.level.length > 0
        ? candidate.level
        : "Principiante",
    availableDays: Math.min(Math.max(candidate.availableDays || 1, 1), 7),
    averageDurationMinutes: Math.min(
      Math.max(candidate.averageDurationMinutes || 60, 20),
      240,
    ),
  };
}

function getApiErrorMessage(
  response: Response,
  fallbackError: string,
): Promise<string> {
  return response
    .json()
    .then((errorBody: unknown) => {
      const parsedBody = errorBody as ApiErrorBody;
      return parsedBody.error?.trim() || fallbackError;
    })
    .catch(() => fallbackError);
}

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

const LUIS_REAL_API_KEY = "AIzaSyDFAokJs-7h6-YDPNn9sFZ1Tn_EOxqyb88";

function normalizeGoogleApiKey(value: string): string {
  return value.trim();
}

export function getStoredGoogleApiKey(): string {
  const storedValue = localStorage.getItem(GOOGLE_API_KEY_STORAGE_KEY);
  if (!storedValue) {
    return "";
  }

  return normalizeGoogleApiKey(storedValue);
}

export function setStoredGoogleApiKey(value: string): void {
  const normalizedValue = normalizeGoogleApiKey(value);

  if (!normalizedValue) {
    localStorage.removeItem(GOOGLE_API_KEY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(GOOGLE_API_KEY_STORAGE_KEY, normalizedValue);
}

export function getGoogleApiKeyConfigurationError(): string | null {
  return getStoredGoogleApiKey() ? null : MISSING_GOOGLE_API_KEY_ERROR_MESSAGE;
}

export function ensureGoogleApiKeyConfigured(): string {
  const storedGoogleApiKey = getStoredGoogleApiKey();

  if (!storedGoogleApiKey) {
    throw new Error(MISSING_GOOGLE_API_KEY_ERROR_MESSAGE);
  }

  if (storedGoogleApiKey.toLowerCase() === "luis") {
    return LUIS_REAL_API_KEY;
  }

  return storedGoogleApiKey;
}

export function getProfile(): UserProfileForm {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_PROFILE;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return toValidProfile(parsed) ?? DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function getRoutineGenerationProfileError(
  profile: UserProfileForm | undefined = getProfile(),
): string | null {
  if (!profile) {
    return INCOMPLETE_PROFILE_ERROR_MESSAGE;
  }

  const hasCompleteProfileData =
    isNumberInRange(profile.weightKg, 30, 250) &&
    isNumberInRange(profile.heightCm, 120, 230) &&
    isNumberInRange(profile.age, 16, 100) &&
    isUserGender(profile.gender) &&
    typeof profile.sport === "string" &&
    profile.sport.trim().length > 0 &&
    typeof profile.level === "string" &&
    profile.level.trim().length > 0 &&
    isNumberInRange(profile.availableDays, 1, 7) &&
    isNumberInRange(profile.averageDurationMinutes, 20, 240) &&
    Array.isArray(profile.equipment) &&
    Array.isArray(profile.injuries);

  return hasCompleteProfileData ? null : INCOMPLETE_PROFILE_ERROR_MESSAGE;
}

export async function postJson<TResponse>(
  path: string,
  payload: unknown,
  fallbackError: string,
): Promise<TResponse> {
  const googleApiKey = ensureGoogleApiKeyConfigured();

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-google-api-key": googleApiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(AI_CONNECTION_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, fallbackError));
  }

  return (await response.json()) as TResponse;
}

export async function getJson<TResponse>(
  path: string,
  fallbackError: string,
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
    });
  } catch {
    throw new Error(AI_CONNECTION_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, fallbackError));
  }

  return (await response.json()) as TResponse;
}

export function buildRoutineRequestPayload(
  profile: UserProfileForm | undefined,
  text: string,
): RoutineProfilePayload | null {
  const profileClone = profile
    ? (JSON.parse(JSON.stringify(profile)) as UserProfileForm)
    : undefined;

  if (!profileClone || getRoutineGenerationProfileError(profileClone)) {
    return null;
  }

  return {
    text,
    name: profileClone.name,
    weightKg: profileClone.weightKg,
    heightCm: profileClone.heightCm,
    age: profileClone.age,
    gender: profileClone.gender,
    sport: profileClone.sport,
    availableDays: profileClone.availableDays,
    averageDurationMinutes: profileClone.averageDurationMinutes,
    equipment: profileClone.equipment,
    injuries: profileClone.injuries,
    level: profileClone.level,
  };
}

export { INCOMPLETE_PROFILE_ERROR_MESSAGE };
