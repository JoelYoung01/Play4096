import { loginWithGoogle } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { friendlyAuthNetworkError } from "@/lib/auth-errors";
import {
  exchangeGoogleCodeForIdToken,
  getGoogleAuthCode,
  getGoogleIdToken,
  googleAuthRequestConfig,
  googleIosRedirectUri
} from "@/lib/google-auth";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/config";
import { useSessionStore } from "@/stores/session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Button } from "./Button";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onPendingChange: (pending: boolean) => void;
  onError: (message: string) => void;
};

export function GoogleLoginButton(props: Props) {
  const available = Platform.OS === "web" ? Boolean(GOOGLE_WEB_CLIENT_ID) : Boolean(GOOGLE_IOS_CLIENT_ID);
  if (!available) return null;
  return <ConfiguredGoogleLoginButton {...props} />;
}

function ConfiguredGoogleLoginButton({ onPendingChange, onError }: Props) {
  const [request, response, promptAsync] = Google.useAuthRequest(
    googleAuthRequestConfig({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID
    })
  );
  const exchanging = useRef(false);
  const handledKey = useRef<string | null>(null);
  const requestRef = useRef(request);
  const onPendingChangeRef = useRef(onPendingChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
    onErrorRef.current = onError;
  }, [onPendingChange, onError]);

  // completeGoogleResponse is recreated each render; handledKey prevents duplicates.
  useEffect(() => {
    if (!response) return;
    void completeGoogleResponse(response);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function completeGoogleResponse(authResponse: NonNullable<typeof response>) {
    if (authResponse.type === "opened") return;
    const errorMessage =
      authResponse.type === "error" ? (authResponse.error?.message ?? "Google sign-in failed") : "";
    const key =
      authResponse.type === "success"
        ? getGoogleIdToken(authResponse) || getGoogleAuthCode(authResponse) || authResponse.type
        : `${authResponse.type}:${errorMessage}`;
    if (handledKey.current === key) return;
    handledKey.current = key;

    if (authResponse.type === "cancel" || authResponse.type === "dismiss") {
      onPendingChangeRef.current(false);
      return;
    }
    if (authResponse.type === "error" || authResponse.type === "locked") {
      onPendingChangeRef.current(false);
      onErrorRef.current(friendlyAuthNetworkError(errorMessage || "Google sign-in failed"));
      return;
    }
    if (authResponse.type !== "success") {
      return;
    }

    if (exchanging.current) return;
    exchanging.current = true;
    onPendingChangeRef.current(true);
    try {
      let idToken = getGoogleIdToken(authResponse);
      const code = getGoogleAuthCode(authResponse);
      if (!idToken && code) {
        const currentRequest = requestRef.current;
        const redirectUri =
          currentRequest?.redirectUri || googleIosRedirectUri(GOOGLE_IOS_CLIENT_ID) || "";
        idToken = await exchangeGoogleCodeForIdToken({
          clientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
          code,
          redirectUri,
          codeVerifier: currentRequest?.codeVerifier
        });
      }
      if (!idToken) {
        throw new Error("Google sign-in did not return a credential.");
      }
      const payload = await loginWithGoogle({ credential: idToken });
      if (!payload?.access_token || !payload?.user) {
        throw new Error("Google sign-in did not return a session.");
      }
      await useSessionStore.getState().setSession(payload.access_token, payload.user);
    } catch (err) {
      onErrorRef.current(friendlyAuthNetworkError(getErrorMessage(err, "Google sign-in failed")));
    } finally {
      exchanging.current = false;
      onPendingChangeRef.current(false);
    }
  }

  return (
    <Button
      variant="outline"
      disabled={!request}
      onPress={() => {
        // Do not set pending before the auth session — a parent re-render can
        // prevent ASWebAuthenticationSession from presenting on iOS.
        void (async () => {
          try {
            const result = await promptAsync();
            if (result) await completeGoogleResponse(result);
          } catch (err) {
            onPendingChangeRef.current(false);
            onErrorRef.current(friendlyAuthNetworkError(getErrorMessage(err, "Google sign-in failed")));
          }
        })();
      }}
    >
      Continue with Google
    </Button>
  );
}
