import type { PerfilUsuario, RutinaResponse } from "../../types/chat";

type ApiErrorBody = {
  error?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export async function generateRutina(
  perfil: PerfilUsuario,
): Promise<RutinaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rutinas/generar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(perfil),
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
