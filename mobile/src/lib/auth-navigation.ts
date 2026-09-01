/** Home route used after a session becomes authenticated. */
export const AUTHED_HOME_HREF = "/(app)/(tabs)/home" as const;

/** Default landing for guests — play first, sign in later. */
export const GUEST_HOME_HREF = "/(app)/(tabs)/home" as const;

/**
 * The login/register stack is already mounted after index.tsx redirects guests
 * here, so a later OAuth `setSession` would otherwise leave the user on login
 * with no error and no navigation.
 */
export function authedHomeHref(status: string): typeof AUTHED_HOME_HREF | null {
  return status === "authed" ? AUTHED_HOME_HREF : null;
}

/** Cold-start destination: guests land in the app, not on the login wall. */
export function coldStartHref(
  status: string
): typeof AUTHED_HOME_HREF | typeof GUEST_HOME_HREF | null {
  if (status === "loading") return null;
  return status === "authed" ? AUTHED_HOME_HREF : GUEST_HOME_HREF;
}
