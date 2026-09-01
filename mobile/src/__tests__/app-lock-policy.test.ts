import { APP_LOCK_GRACE_MS, shouldLockAfterBackground } from "@/lib/app-lock-policy";

describe("shouldLockAfterBackground", () => {
  it("does not lock when the app was never backgrounded", () => {
    expect(shouldLockAfterBackground(null, Date.now())).toBe(false);
    expect(shouldLockAfterBackground(undefined, Date.now())).toBe(false);
  });

  it("does not lock for brief multitasking inside the grace window", () => {
    const backgroundedAt = 1_000_000;
    expect(shouldLockAfterBackground(backgroundedAt, backgroundedAt + APP_LOCK_GRACE_MS - 1)).toBe(false);
  });

  it("locks after the grace window", () => {
    const backgroundedAt = 1_000_000;
    expect(shouldLockAfterBackground(backgroundedAt, backgroundedAt + APP_LOCK_GRACE_MS)).toBe(true);
    expect(shouldLockAfterBackground(backgroundedAt, backgroundedAt + APP_LOCK_GRACE_MS + 5_000)).toBe(true);
  });
});
