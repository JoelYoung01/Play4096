import { API_BASE_URL } from "@/config";
import type { TokenPayload } from "@/types";
import { get, post } from "./client";
import { parseApiErrorBody } from "./errors";

const NETWORK_MESSAGE = "Network error. Check your connection and try again.";

export class AuthApiError extends Error {
  status: number;
  detail: unknown;
  userMessage: string;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.detail = detail;
    this.userMessage = message;
  }
}

async function authPost<T>(path: string, body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new AuthApiError(NETWORK_MESSAGE, 503, err);
  }
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const parsed = parseApiErrorBody(data);
    throw new AuthApiError(parsed.userMessage, response.status, data);
  }
  return data as T;
}

export function loginWithPassword(payload: { username: string; password: string }) {
  return authPost<TokenPayload>("/auth/login", payload);
}

export function registerWithPassword(payload: { username: string; password: string; email?: string; displayName?: string }) {
  return authPost<TokenPayload>("/auth/register", payload);
}

export function loginWithApple(payload: { identity_token: string; full_name?: string | null }) {
  return authPost<TokenPayload>("/auth/apple", payload);
}

export function loginWithGoogle(payload: { credential: string }) {
  return authPost<TokenPayload>("/auth/google", payload);
}

export function getMe() {
  return get<TokenPayload>("/auth/me");
}

export function logout() {
  return post<{ success?: boolean }>("/auth/logout");
}
