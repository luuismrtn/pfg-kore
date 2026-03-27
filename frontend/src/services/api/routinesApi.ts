import type { RoutineResponse } from "@/features/routine/types";
import type { UserProfileForm } from "@/features/profile/types";

type ApiErrorBody = {
  error?: string;
};

type ChangeRoutineDayPayload = {
  routine: RoutineResponse;
  dayToChange: string;
  profile?: ReturnType<typeof buildRoutineRequestPayload>;
};

type ChangeRoutineExercisePayload = {
  routine: RoutineResponse;
  dayToChange: string;
  exerciseToChange: string;
  profile?: ReturnType<typeof buildRoutineRequestPayload>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const PROFILE_STORAGE_KEY = "kore.user-profile.v1";
const INCOMPLETE_PROFILE_ERROR_MESSAGE =
  "Completa los datos obligatorios del perfil para generar una rutina.";

const DEFAULT_PROFILE: UserProfileForm = {
  name: "",
  weightKg: "",
  heightCm: "",
  sport: "Musculación",
  equipment: [],
  injuries: [],
  availableDays: 3,
  averageDurationMinutes: 60,
  level: "Principiante",
};

function toValidProfile(value: unknown): UserProfileForm | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<UserProfileForm>;

  const equipment = Array.isArray(candidate.equipment)
    ? candidate.equipment.filter((x) => typeof x === "string")
    : null;
  const injuries = Array.isArray(candidate.injuries)
    ? candidate.injuries.filter((x) => typeof x === "string")
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

function getProfile(): UserProfileForm {
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

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
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

export async function generateRoutine(text: string): Promise<RoutineResponse> {
  const profile = getProfile();
  const profileError = getRoutineGenerationProfileError(profile);

  if (profileError) {
    throw new Error(profileError);
  }

  const requestPayload = buildRoutineRequestPayload(profile, text);

  if (!requestPayload) {
    throw new Error(INCOMPLETE_PROFILE_ERROR_MESSAGE);
  }

  const response = await fetch(`${API_BASE_URL}/api/routines/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    let backendError = "No se pudo generar la rutina.";

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) {
        backendError = errorBody.error;
      }
    } catch {
      // Keep generic message when backend does not return valid JSON.
    }

    throw new Error(backendError);
  }

  return (await response.json()) as RoutineResponse;
}

export async function changeRoutineDay(
  routine: RoutineResponse,
  dayToChange: string,
): Promise<RoutineResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const requestPayload: ChangeRoutineDayPayload = {
    routine,
    dayToChange,
    profile: profilePayload ?? undefined,
  };

  const response = await fetch(`${API_BASE_URL}/api/routines/change-day`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    let backendError = "No se pudo regenerar el dia.";

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) {
        backendError = errorBody.error;
      }
    } catch {
      // Keep generic message when backend does not return valid JSON.
    }

    throw new Error(backendError);
  }

  return (await response.json()) as RoutineResponse;
}

export async function changeRoutineExercise(
  routine: RoutineResponse,
  dayToChange: string,
  exerciseToChange: string,
): Promise<RoutineResponse> {
  const profile = getProfile();
  const profilePayload = buildRoutineRequestPayload(profile, "");

  const requestPayload: ChangeRoutineExercisePayload = {
    routine,
    dayToChange,
    exerciseToChange,
    profile: profilePayload ?? undefined,
  };

  const response = await fetch(
    `${API_BASE_URL}/api/routines/cambiar-ejercicio-rutina`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    },
  );

  if (!response.ok) {
    let backendError = "No se pudo cambiar el ejercicio.";

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) {
        backendError = errorBody.error;
      }
    } catch {
      // Keep generic message when backend does not return valid JSON.
    }

    throw new Error(backendError);
  }

  return (await response.json()) as RoutineResponse;
}

function buildRoutineRequestPayload(
  profile: UserProfileForm | undefined,
  text: string,
) {
  const profileClone = JSON.parse(JSON.stringify(profile)) as
    | UserProfileForm
    | undefined;

  if (!profileClone || getRoutineGenerationProfileError(profileClone)) {
    return null;
  }

  return {
    text,
    name: profileClone.name,
    weightKg: profileClone.weightKg,
    heightCm: profileClone.heightCm,
    sport: profileClone.sport,
    availableDays: profileClone.availableDays,
    averageDurationMinutes: profileClone.averageDurationMinutes,
    equipment: profileClone.equipment,
    injuries: profileClone.injuries,
    level: profileClone.level,
  };
}
