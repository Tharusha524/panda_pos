type ApiErrorShape = {
  message?: string;
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
  status?: number;
  friendlyMessage?: string;
};

/**
 * Returns a user-safe error message without localhost URLs, ports, or raw network details.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) {
    return fallback;
  }

  const shaped = error as ApiErrorShape;

  if (shaped.friendlyMessage) {
    return shaped.friendlyMessage;
  }

  const raw = extractRawMessage(error);
  const sanitized = sanitizeMessage(raw);

  if (sanitized) {
    return sanitized;
  }

  if (shaped.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (shaped.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (shaped.status === 404) {
    return "The requested item was not found.";
  }

  if (shaped.status === 422) {
    return "Please check the form and correct any invalid fields.";
  }

  if (shaped.status && shaped.status >= 500) {
    return "Server error. Please try again later.";
  }

  return fallback;
}

function extractRawMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (!(error && typeof error === "object")) {
    return "";
  }

  const e = error as ApiErrorShape;

  if (e.data?.errors && typeof e.data.errors === "object") {
    const firstField = Object.values(e.data.errors).flat()[0];
    if (firstField) {
      return firstField;
    }
  }

  if (typeof e.data?.message === "string") {
    return e.data.message;
  }

  if (typeof e.message === "string") {
    return e.message;
  }

  return "";
}

function sanitizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }

  const lower = trimmed.toLowerCase();

  if (
    lower.includes("network error") ||
    lower.includes("err_network") ||
    lower.includes("failed to fetch") ||
    lower.includes("net::")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request timed out. Please try again.";
  }

  if (lower.includes("cors")) {
    return "Unable to reach the server. Please contact support if this continues.";
  }

  let cleaned = trimmed;

  // Remove full URLs (http/https)
  cleaned = cleaned.replace(/https?:\/\/[^\s,)]+/gi, "");

  // Replace host references with neutral wording
  cleaned = cleaned.replace(/localhost(:\d+)?/gi, "the server");
  cleaned = cleaned.replace(/127\.0\.0\.1(:\d+)?/gi, "the server");
  cleaned = cleaned.replace(/0\.0\.0\.0(:\d+)?/gi, "the server");

  // Remove orphan port fragments like :5173 or :8000
  cleaned = cleaned.replace(/:\d{2,5}\b/g, "");

  // Collapse whitespace and stray punctuation
  cleaned = cleaned.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();

  if (!cleaned || cleaned.length < 3) {
    return "";
  }

  return cleaned;
}
