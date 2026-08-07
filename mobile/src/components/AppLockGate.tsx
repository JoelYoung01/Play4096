import { useAppLockStore } from "@/stores/app-lock";
import { useSessionStore } from "@/stores/session";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { LockScreen } from "./LockScreen";

export function AppLockGate() {
  const status = useSessionStore((s) => s.status);
  const enabled = useAppLockStore((s) => s.enabled);
  const locked = useAppLockStore((s) => s.locked);
  useEffect(() => { if (Platform.OS === "web") return; const sub = AppState.addEventListener("change", (state) => { if (state === "background") useAppLockStore.getState().lock(); }); return () => sub.remove(); }, []);
  if (status !== "authed" || !enabled || !locked) return null;
  return <LockScreen />;
}
