import { sileo } from "sileo";

const DEFAULT_ERROR_MESSAGE = "No se pudo completar la acción.";
const DEFAULT_ERROR_TITLE = "Ha ocurrido un error";
const AI_CONNECTION_ERROR_TITLE = "Error de conexión con la IA";
const AI_CONFIGURATION_ERROR_TITLE = "Configuración de IA incompleta";
const AI_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con la IA. Revisa tu conexión e inténtalo de nuevo.";

function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function isAiConnectionError(message: string): boolean {
  return /(conexi[oó]n con la ia|failed to fetch|network\s?error|load failed|network request failed)/i.test(
    message,
  );
}

function isAiConfigurationError(message: string): boolean {
  return /(google api key|api key|configura tu google api key)/i.test(message);
}

export function notifyRoutineGenerated(): void {
  sileo.success({
    title: "Nueva rutina generada",
    description: "Tu panel se actualizó con una nueva rutina.",
  });
}

export function notifyRoutineDayGenerated(day: string): void {
  sileo.success({
    title: "Nuevo día generado",
    description: `Se actualizó ${day} en tu rutina.`,
  });
}

export function notifyRoutineDayAdded(): void {
  sileo.success({
    title: "Nuevo día añadido",
    description: "Tu rutina ahora tiene un día adicional.",
  });
}

export function notifyRoutineExerciseChanged(day: string): void {
  sileo.success({
    title: "Ejercicio actualizado",
    description: `Se cambió un ejercicio en ${day}.`,
  });
}

export function notifyProfileUpdated(): void {
  sileo.success({
    title: "Perfil actualizado",
    description: "Los cambios en tu perfil se guardaron correctamente.",
  });
}

export function getOperationErrorMessage(
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): string {
  const message = resolveErrorMessage(error, fallbackMessage);
  return isAiConnectionError(message) ? AI_CONNECTION_ERROR_MESSAGE : message;
}

export function notifyOperationError(
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
  fallbackTitle = DEFAULT_ERROR_TITLE,
): void {
  const message = getOperationErrorMessage(error, fallbackMessage);
  const isConnectionIssue = isAiConnectionError(message);
  const isConfigurationIssue = isAiConfigurationError(message);

  sileo.error({
    title: isConnectionIssue
      ? AI_CONNECTION_ERROR_TITLE
      : isConfigurationIssue
        ? AI_CONFIGURATION_ERROR_TITLE
        : fallbackTitle,
    description: message,
  });
}
