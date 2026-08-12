import { loginWithApple } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { friendlyAuthNetworkError } from "@/lib/auth-errors";
import { useSessionStore } from "@/stores/session";
import * as AppleAuthentication from "expo-apple-authentication";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type Props = { onPendingChange: (pending: boolean) => void; onError: (message: string) => void };

export function AppleLoginButton({ onPendingChange, onError }: Props) {
  const [available, setAvailable] = useState(false);
  const signingIn = useRef(false);
  const onPendingChangeRef = useRef(onPendingChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
    onErrorRef.current = onError;
  }, [onPendingChange, onError]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let cancelled = false;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (!cancelled) setAvailable(ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      // Do not call onPendingChange before the native sheet. Parent re-renders during
      // ASAuthorization can deliver a second onPress and stack identical error alerts.
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });
      if (!credential.identityToken) {
        throw new Error("Apple sign-in did not return a credential.");
      }
      onPendingChangeRef.current(true);
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ");
      const payload = await loginWithApple({
        identity_token: credential.identityToken,
        full_name: fullName || null
      });
      await useSessionStore.getState().setSession(payload.access_token, payload.user);
    } catch (err) {
      if ((err as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        onErrorRef.current(
          friendlyAuthNetworkError(getErrorMessage(err, "Apple sign-in failed"))
        );
      }
    } finally {
      onPendingChangeRef.current(false);
      signingIn.current = false;
    }
  }, []);

  if (!available) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={12}
      style={{ width: "100%", height: 46 }}
      onPress={() => {
        void signIn();
      }}
    />
  );
}
