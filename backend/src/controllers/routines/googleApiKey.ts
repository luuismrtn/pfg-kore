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

type ErrorLike = {
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
  };
  response?: {
    status?: unknown;
    data?: unknown;
  };
};

function normalizeStatusCode(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0
      ? parsedValue
      : undefined;
  }

  return undefined;
}

function extractCandidateMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as ErrorLike;
  const responseData = candidate.response?.data as ErrorLike | undefined;

  const directMessage = candidate.message;
  if (typeof directMessage === "string" && directMessage.trim().length > 0) {
    return directMessage.trim();
  }

  const nestedMessage = candidate.error?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
    return nestedMessage.trim();
  }

  const responseMessage = responseData?.error?.message;
  if (
    typeof responseMessage === "string" &&
    responseMessage.trim().length > 0
  ) {
    return responseMessage.trim();
  }

  const responseDataMessage = responseData?.message;
  if (
    typeof responseDataMessage === "string" &&
    responseDataMessage.trim().length > 0
  ) {
    return responseDataMessage.trim();
  }

  return undefined;
}

function parseStructuredErrorMessage(
  message: string,
): { message?: string; statusCode?: number } | undefined {
  try {
    const parsed = JSON.parse(message) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }

    const candidate = parsed as ErrorLike;
    const responseData = candidate.response?.data as ErrorLike | undefined;
    const nestedError = candidate.error;

    const statusCode =
      normalizeStatusCode(candidate.statusCode) ??
      normalizeStatusCode(candidate.status) ??
      normalizeStatusCode(candidate.code) ??
      normalizeStatusCode(nestedError?.statusCode) ??
      normalizeStatusCode(nestedError?.status) ??
      normalizeStatusCode(nestedError?.code) ??
      normalizeStatusCode(responseData?.statusCode) ??
      normalizeStatusCode(responseData?.status) ??
      normalizeStatusCode(responseData?.code) ??
      normalizeStatusCode((responseData as ErrorLike | undefined)?.error?.code);

    const readableMessage =
      extractCandidateMessage(candidate) ??
      extractCandidateMessage(nestedError) ??
      extractCandidateMessage(responseData) ??
      extractCandidateMessage(responseData?.error);

    if (statusCode === undefined && readableMessage === undefined) {
      return undefined;
    }

    const result: { message?: string; statusCode?: number } = {};

    if (readableMessage !== undefined) {
      result.message = readableMessage;
    }

    if (statusCode !== undefined) {
      result.statusCode = statusCode;
    }

    return result;
  } catch {
    return undefined;
  }
}

export function getErrorResponseDetails(
  error: unknown,
  fallbackMessage: string,
  fallbackStatusCode = 500,
): { statusCode: number; message: string } {
  let statusCode = fallbackStatusCode;
  let message = fallbackMessage;

  const candidates: unknown[] = [error];

  if (error instanceof Error) {
    candidates.push(error.message);
  }

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const candidateStatusCode = normalizeStatusCode(
        (candidate as ErrorLike).statusCode ??
          (candidate as ErrorLike).status ??
          (candidate as ErrorLike).code ??
          (candidate as ErrorLike).response?.status,
      );

      if (candidateStatusCode !== undefined) {
        statusCode = candidateStatusCode;
      }

      const candidateMessage = extractCandidateMessage(candidate);
      if (candidateMessage) {
        message = candidateMessage;
      }
    }

    if (typeof candidate === "string") {
      const trimmedCandidate = candidate.trim();
      if (!trimmedCandidate) {
        continue;
      }

      const parsed = parseStructuredErrorMessage(trimmedCandidate);
      if (parsed?.statusCode !== undefined) {
        statusCode = parsed.statusCode;
      }

      if (parsed?.message) {
        message = parsed.message;
      } else {
        message = trimmedCandidate;
      }
    }
  }

  const parsedMessage = parseStructuredErrorMessage(message);
  if (parsedMessage?.statusCode !== undefined) {
    statusCode = parsedMessage.statusCode;
  }

  if (parsedMessage?.message) {
    message = parsedMessage.message;
  }

  return {
    statusCode,
    message,
  };
}
