import { getMe, logout, refreshSession } from "@/api/auth";
import { secureStorage } from "@/lib/secure-storage";
import type { TokenPayload, User } from "@/types";
import { create } from "zustand";

const TOKEN_KEY = "play4096.session_token";
const REFRESH_KEY = "play4096.refresh_token";
const USER_KEY = "play4096.session_user";

type SessionStatus = "loading" | "guest" | "authed";

type SessionState = {
  status: SessionStatus;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  bootstrap: () => Promise<void>;
  setSession: (payload: Pick<TokenPayload, "access_token" | "user"> & Partial<TokenPayload>) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  clear: () => Promise<void>;
  logout: () => Promise<void>;
  tryRefresh: () => Promise<boolean>;
};

let bootstrapStarted = false;
let refreshInFlight: Promise<boolean> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "loading",
  token: null,
  refreshToken: null,
  user: null,
  async bootstrap() {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    const token = await secureStorage.get(TOKEN_KEY);
    const refreshToken = await secureStorage.get(REFRESH_KEY);
    const userText = await secureStorage.get(USER_KEY);
    const cachedUser = userText ? (JSON.parse(userText) as User) : null;
    if (!token) {
      set({ status: "guest", token: null, refreshToken: null, user: null });
      return;
    }
    set({ status: "authed", token, refreshToken, user: cachedUser });
    try {
      const payload = await getMe();
      await get().setSession(payload);
    } catch {
      // Access may have expired — try refresh before giving up to cached session.
      const refreshed = await get().tryRefresh();
      if (!refreshed) {
        set({ status: "authed", token, refreshToken, user: cachedUser });
      }
    }
  },
  async setSession(payload) {
    const accessToken = payload.access_token;
    const nextRefresh =
      typeof payload.refresh_token === "string" && payload.refresh_token.length > 0
        ? payload.refresh_token
        : get().refreshToken;
    await secureStorage.set(TOKEN_KEY, accessToken);
    if (nextRefresh) await secureStorage.set(REFRESH_KEY, nextRefresh);
    await secureStorage.set(USER_KEY, JSON.stringify(payload.user));
    set({ status: "authed", token: accessToken, refreshToken: nextRefresh ?? null, user: payload.user });
  },
  async setUser(user) {
    if (user) await secureStorage.set(USER_KEY, JSON.stringify(user));
    else await secureStorage.remove(USER_KEY);
    set({ user });
  },
  async clear() {
    await secureStorage.remove(TOKEN_KEY);
    await secureStorage.remove(REFRESH_KEY);
    await secureStorage.remove(USER_KEY);
    set({ status: "guest", token: null, refreshToken: null, user: null });
  },
  async logout() {
    try {
      if (get().token) await logout();
    } finally {
      await get().clear();
    }
  },
  async tryRefresh() {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
      const currentRefresh = get().refreshToken ?? (await secureStorage.get(REFRESH_KEY));
      if (!currentRefresh) return false;
      try {
        const payload = await refreshSession(currentRefresh);
        await get().setSession(payload);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }
}));
