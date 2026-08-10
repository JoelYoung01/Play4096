import { secureStorage } from "@/lib/secure-storage";
import { create } from "zustand";

const APP_LOCK_KEY = "play4096.app_lock";

type AppLockState = {
  ready: boolean;
  enabled: boolean;
  locked: boolean;
  bootstrap: () => Promise<void>;
  setEnabled: (on: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
};

let bootstrapStarted = false;

export const useAppLockStore = create<AppLockState>((set, get) => ({
  ready: false,
  enabled: false,
  locked: false,
  async bootstrap() {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    const enabled = (await secureStorage.get(APP_LOCK_KEY)) === "1";
    set({ ready: true, enabled, locked: enabled });
  },
  async setEnabled(on) {
    if (on) await secureStorage.set(APP_LOCK_KEY, "1");
    else await secureStorage.remove(APP_LOCK_KEY);
    set({ enabled: on, locked: false });
  },
  lock() {
    if (get().enabled) set({ locked: true });
  },
  unlock() {
    set({ locked: false });
  }
}));
