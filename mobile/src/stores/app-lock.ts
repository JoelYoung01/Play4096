import { APP_LOCK_GRACE_MS, shouldLockAfterBackground } from "@/lib/app-lock-policy";
import { secureStorage } from "@/lib/secure-storage";
import { create } from "zustand";

const APP_LOCK_KEY = "play4096.app_lock";

type AppLockState = {
  ready: boolean;
  enabled: boolean;
  locked: boolean;
  backgroundedAt: number | null;
  bootstrap: () => Promise<void>;
  setEnabled: (on: boolean) => Promise<void>;
  noteBackground: () => void;
  maybeLockOnForeground: (now?: number) => void;
  lock: () => void;
  unlock: () => void;
};

let bootstrapStarted = false;

export const useAppLockStore = create<AppLockState>((set, get) => ({
  ready: false,
  enabled: false,
  locked: false,
  backgroundedAt: null,
  async bootstrap() {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    const enabled = (await secureStorage.get(APP_LOCK_KEY)) === "1";
    // Cold start with lock enabled still requires biometrics once.
    set({ ready: true, enabled, locked: enabled, backgroundedAt: null });
  },
  async setEnabled(on) {
    if (on) await secureStorage.set(APP_LOCK_KEY, "1");
    else await secureStorage.remove(APP_LOCK_KEY);
    set({ enabled: on, locked: false, backgroundedAt: null });
  },
  noteBackground() {
    if (!get().enabled) return;
    set({ backgroundedAt: Date.now() });
  },
  maybeLockOnForeground(now = Date.now()) {
    const { enabled, backgroundedAt } = get();
    if (!enabled) {
      set({ backgroundedAt: null });
      return;
    }
    if (shouldLockAfterBackground(backgroundedAt, now, APP_LOCK_GRACE_MS)) {
      set({ locked: true, backgroundedAt: null });
      return;
    }
    set({ backgroundedAt: null });
  },
  lock() {
    if (get().enabled) set({ locked: true });
  },
  unlock() {
    set({ locked: false, backgroundedAt: null });
  }
}));
