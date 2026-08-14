/** Home route used after a session becomes authenticated. */
export const AUTHED_HOME_HREF = "/(app)/(tabs)/home" as const;

/**
 * The login/register stack is already mounted after index.tsx redirects guests
 * here, so a later OAuth `setSession` would otherwise leave the user on login
 * with no error and no navigation.
 */
export function authedHomeHref(status: string): typeof AUTHED_HOME_HREF | null {
  return status === "authed" ? AUTHED_HOME_HREF : null;
}
