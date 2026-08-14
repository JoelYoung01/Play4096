import { Alert } from "react-native";

type RecentAlert = { title: string; message: string; at: number };

let recent: RecentAlert | null = null;
const alertTimers: ReturnType<typeof setTimeout>[] = [];

const DEDUPE_MS = 1500;
/** iOS drops Alert.alert while ASWebAuthenticationSession is still dismissing. */
export const ALERT_DELAY_MS = 400;

/**
 * Show an Alert, ignoring duplicate title+message calls within a short window.
 * Prevents stacked iOS dialogs when auth handlers fire more than once for one attempt.
 */
export function alertOnce(title: string, message: string): void {
  const now = Date.now();
  if (
    recent &&
    recent.title === title &&
    recent.message === message &&
    now - recent.at < DEDUPE_MS
  ) {
    return;
  }
  recent = { title, message, at: now };
  alertTimers.push(
    setTimeout(() => {
      Alert.alert(title, message);
    }, ALERT_DELAY_MS)
  );
}

/** Test helper. */
export function resetAlertOnceForTests(): void {
  recent = null;
  for (const timer of alertTimers) clearTimeout(timer);
  alertTimers.length = 0;
}
