import type { RoutineResponse } from "@/features/routine/types";
import type { RoutineProfilePayload } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export type ExportRoutinePdfPayload = {
  routine: RoutineResponse;
  profile?: RoutineProfilePayload;
};

type ApiErrorBody = {
  error?: string;
};

async function getApiErrorMessage(
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

export async function exportRoutinePdf(
  payload: ExportRoutinePdfPayload,
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/routines/export-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      "No se pudo generar el PDF.",
    );
    throw new Error(message);
  }

  return response.blob();
}
