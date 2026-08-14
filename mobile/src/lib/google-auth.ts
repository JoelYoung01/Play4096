import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

/** Google's installed-app redirect for an iOS OAuth client id. */
export function googleIosRedirectUri(clientId: string | undefined): string | null {
  if (!clientId) return null;
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/i.exec(clientId.trim());
  return match ? `com.googleusercontent.apps.${match[1]}:/oauthredirect` : null;
}

type GoogleAuthResponse = {
  type: string;
  params?: Record<string, unknown>;
  authentication?: { idToken?: string | null } | null;
};

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) return value[0];
  return null;
}

/** ID token from an implicit response or a completed code exchange. */
export function getGoogleIdToken(response: GoogleAuthResponse | null | undefined): string | null {
  if (!response || response.type !== "success") return null;
  return firstString(response.params?.id_token) ?? response.authentication?.idToken ?? null;
}

export function getGoogleAuthCode(response: GoogleAuthResponse | null | undefined): string | null {
  if (!response || response.type !== "success") return null;
  return firstString(response.params?.code);
}

const googleDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  userInfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo"
};

/**
 * Exchange an auth code for an ID token. Expo's Google hook does this internally
 * and swallows failures, which left iOS on the login screen with no alert.
 */
export async function exchangeGoogleCodeForIdToken(opts: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<string> {
  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId: opts.clientId,
      code: opts.code,
      redirectUri: opts.redirectUri,
      extraParams: opts.codeVerifier ? { code_verifier: opts.codeVerifier } : {}
    },
    googleDiscovery
  );
  const idToken = tokens.idToken;
  if (!idToken) {
    throw new Error("Google sign-in did not return a credential.");
  }
  return idToken;
}

export function googleAuthRequestConfig(opts: { iosClientId: string; webClientId: string }) {
  const iosRedirect = googleIosRedirectUri(opts.iosClientId);
  return {
    iosClientId: opts.iosClientId || undefined,
    webClientId: opts.webClientId || undefined,
    clientId: opts.webClientId || undefined,
    redirectUri: Platform.OS === "ios" ? iosRedirect ?? undefined : undefined,
    shouldAutoExchangeCode: false as const,
    responseType:
      Platform.OS === "web" ? AuthSession.ResponseType.IdToken : AuthSession.ResponseType.Code
  };
}
