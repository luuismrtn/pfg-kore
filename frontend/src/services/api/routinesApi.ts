import { getProfile } from "@/pages/ProfilePage";
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

export async function generateRoutine(text: string): Promise<RoutineResponse> {
  const profile = getProfile();
  const requestPayload = buildRoutineRequestPayload(profile, text);

  if (!requestPayload) {
    throw new Error("Debes guardar tu perfil antes de generar una rutina.");
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

  if (!profileClone) {
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
