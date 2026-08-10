import { getMe, logout } from "@/api/auth";
import { secureStorage } from "@/lib/secure-storage";
import type { User } from "@/types";
import { create } from "zustand";

const TOKEN_KEY = "play4096.session_token";
const USER_KEY = "play4096.session_user";

type SessionStatus = "loading" | "guest" | "authed";

type SessionState = {
  status: SessionStatus;
  token: string | null;
  user: User | null;
  bootstrap: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  clear: () => Promise<void>;
  logout: () => Promise<void>;
};

let bootstrapStarted = false;

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "loading",
  token: null,
  user: null,
  async bootstrap() {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    const token = await secureStorage.get(TOKEN_KEY);
    const userText = await secureStorage.get(USER_KEY);
    const cachedUser = userText ? (JSON.parse(userText) as User) : null;
    if (!token) {
      set({ status: "guest", token: null, user: null });
      return;
    }
    set({ status: "authed", token, user: cachedUser });
    try {
      const payload = await getMe();
      await get().setSession(payload.access_token, payload.user);
    } catch {
      // Keep a cached session during transient offline starts.
      set({ status: "authed", token, user: cachedUser });
    }
  },
  async setSession(token, user) {
    await secureStorage.set(TOKEN_KEY, token);
    await secureStorage.set(USER_KEY, JSON.stringify(user));
    set({ status: "authed", token, user });
  },
  async setUser(user) {
    if (user) await secureStorage.set(USER_KEY, JSON.stringify(user));
    else await secureStorage.remove(USER_KEY);
    set({ user });
  },
  async clear() {
    await secureStorage.remove(TOKEN_KEY);
    await secureStorage.remove(USER_KEY);
    set({ status: "guest", token: null, user: null });
  },
  async logout() {
    try {
      if (get().token) await logout();
    } finally {
      await get().clear();
    }
  }
}));
