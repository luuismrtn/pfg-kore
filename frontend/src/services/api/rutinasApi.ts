import { getProfile } from "@/pages/ProfilePage";
import type { PerfilUsuario, RutinaResponse } from "../../types/chat";
import type { UserProfileForm } from "@/types/profile";

type ApiErrorBody = {
  error?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export async function generateRutina(text: string): Promise<RutinaResponse> {
  const profile = getProfile();
  const promptProfile = addMessage(profile, text);

  const response = await fetch(`${API_BASE_URL}/api/rutinas/generar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promptProfile),
  });

  if (!response.ok) {
    let backendError = "No se pudo generar la rutina.";

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) {
        backendError = errorBody.error;
      }
    } catch {
      // Si el backend no devuelve JSON valido, mantenemos un mensaje generico.
    }

    throw new Error(backendError);
  }

  return (await response.json()) as RutinaResponse;
}

function addMessage(profile: UserProfileForm | undefined, text: string) {
  const profile2 = JSON.parse(JSON.stringify(profile)) as
    | UserProfileForm
    | undefined;

  if (!profile2) {
    return null;
  }

  return {
    text,
    name: profile2.name,
    weightKg: profile2.weightKg,
    heightCm: profile2.heightCm,
    sport: profile2.sport,
    availableDays: profile2.availableDays,
    averageDurationMinutes: profile2.averageDurationMinutes,
    equipment: profile2.equipment,
  };
}
