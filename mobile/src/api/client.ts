import { API_BASE_URL } from "@/config";
import { queryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session";
import { parseApiErrorBody } from "./errors";

function networkErrorMessage(): string {
  try {
    const host = new URL(API_BASE_URL).host;
    return `Could not reach ${host}. Check your connection and try again.`;
  } catch {
    return "Network error. Check your connection and try again.";
  }
}

export class ApiError extends Error {
  status: number;
  userMessage: string;
  detail: unknown;
  code?: string;

  constructor(message: string, status: number, options?: { userMessage?: string; detail?: unknown; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.userMessage = options?.userMessage || message;
    this.detail = options?.detail;
    this.code = options?.code;
  }
}

function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function handleUnauthorized() {
  void useSessionStore.getState().clear();
  queryClient.clear();
}

async function fetchOnce(url: string, options?: RequestInit): Promise<Response> {
  const token = useSessionStore.getState().token;
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) ?? {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(resolveUrl(url), { ...options, headers });
  } catch {
    throw new ApiError(networkErrorMessage(), 503, { userMessage: networkErrorMessage() });
  }
}

export async function doFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const hadToken = Boolean(useSessionStore.getState().token);
  let response = await fetchOnce(url, options);

  if (response.status === 401 && hadToken) {
    const refreshed = await useSessionStore.getState().tryRefresh();
    if (refreshed) {
      response = await fetchOnce(url, options);
    } else {
      handleUnauthorized();
    }
  }

  if (!response.ok) {
    if (response.status === 401 && hadToken) handleUnauthorized();
    const parsed = parseApiErrorBody(await readBody(response));
    throw new ApiError(parsed.userMessage, response.status, parsed);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const get = <T>(url: string) => doFetch<T>(url);
export const post = <T>(url: string, body?: object) =>
  doFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
export const patch = <T>(url: string, body?: object) =>
  doFetch<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
export const del = <T>(url: string, body?: object) =>
  doFetch<T>(url, {
    method: "DELETE",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
