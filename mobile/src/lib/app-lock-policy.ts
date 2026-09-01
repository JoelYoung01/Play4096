/** Only re-prompt Face ID / Touch ID after the app has been away this long. */
export const APP_LOCK_GRACE_MS = 30 * 60 * 1000;

/**
 * Pure helper for app-lock gating: lock only after the grace window, not on
 * every brief background (notifications, multitasking, etc.).
 */
export function shouldLockAfterBackground(
  backgroundedAt: number | null | undefined,
  now: number,
  graceMs: number = APP_LOCK_GRACE_MS
): boolean {
  if (backgroundedAt == null || !Number.isFinite(backgroundedAt)) return false;
  return now - backgroundedAt >= graceMs;
}
