export type ParsedApiError = { userMessage: string; detail?: unknown; code?: string };

export function parseApiErrorBody(body: unknown): ParsedApiError {
  if (!body) return { userMessage: "Request failed" };
  if (typeof body === "string") return { userMessage: body };
  if (typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message =
      (typeof record.error === "string" && record.error) ||
      (typeof record.user_message === "string" && record.user_message) ||
      (typeof record.message === "string" && record.message) ||
      "Request failed";
    return {
      userMessage: message,
      detail: record.detail ?? body,
      code: typeof record.code === "string" ? record.code : undefined
    };
  }
  return { userMessage: "Request failed" };
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object") {
    const maybe = error as { userMessage?: string; message?: string };
    return maybe.userMessage || maybe.message || fallback;
  }
  return fallback;
}
