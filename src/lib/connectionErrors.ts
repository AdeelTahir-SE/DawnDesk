export const CONNECTION_ERROR_EVENT = "dawndesk:connection-error";

export type ConnectionErrorDetail = {
  source?: "project-manager" | "finance" | "supabase" | string;
  message: string;
  rawMessage?: string;
};

const CONNECTION_ERROR_MESSAGE = "Sorry, internet connection error. Go back to DawnDesk dashboard.";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return [value.message, value.details, value.hint, value.code].filter(Boolean).join(" ");
  }
  return String(error ?? "");
}

export function isConnectionError(error: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;

  const message = getErrorMessage(error).toLowerCase();
  return [
    "failed to fetch",
    "networkerror",
    "network error",
    "load failed",
    "err_internet_disconnected",
    "err_network",
    "err_connection",
    "connection refused",
    "connection reset",
    "timeout",
    "timed out",
  ].some((pattern) => message.includes(pattern));
}

export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE;
}

export function emitConnectionError(error: unknown, source?: ConnectionErrorDetail["source"]) {
  if (typeof window === "undefined" || !isConnectionError(error)) return;

  window.dispatchEvent(new CustomEvent<ConnectionErrorDetail>(CONNECTION_ERROR_EVENT, {
    detail: {
      source,
      message: CONNECTION_ERROR_MESSAGE,
      rawMessage: getErrorMessage(error),
    },
  }));
}
