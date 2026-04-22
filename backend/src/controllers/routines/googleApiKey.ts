import type { Request } from "express";

export function readGoogleApiKeyFromRequest(req: Request): string | undefined {
  const headerValue = req.header("x-google-api-key");

  if (typeof headerValue !== "string") {
    return undefined;
  }

  const normalizedValue = headerValue.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

export function isMissingGoogleApiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /missing google api key/i.test(error.message);
}
