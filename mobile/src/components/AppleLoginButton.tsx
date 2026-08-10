import { loginWithApple } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { useSessionStore } from "@/stores/session";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type Props = { onPendingChange: (pending: boolean) => void; onError: (message: string) => void };

export function AppleLoginButton({ onPendingChange, onError }: Props) {
  const [available, setAvailable] = useState(false);
  const signingIn = useRef(false);
  useEffect(() => { if (Platform.OS !== "ios") return; let cancelled = false; AppleAuthentication.isAvailableAsync().then((ok) => !cancelled && setAvailable(ok)).catch(() => !cancelled && setAvailable(false)); return () => { cancelled = true; }; }, []);
  if (!available) return null;
  const signIn = async () => {
    if (signingIn.current) return; signingIn.current = true; onPendingChange(true);
    try {
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      if (!credential.identityToken) throw new Error("Apple sign-in did not return a credential.");
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
      const payload = await loginWithApple({ identity_token: credential.identityToken, full_name: fullName || null });
      await useSessionStore.getState().setSession(payload.access_token, payload.user);
    } catch (err) { if ((err as { code?: string }).code !== "ERR_REQUEST_CANCELED") onError(getErrorMessage(err, "Apple sign-in failed")); }
    finally { onPendingChange(false); signingIn.current = false; }
  };
  return <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN} buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE} cornerRadius={12} style={{ width: "100%", height: 46 }} onPress={() => void signIn()} />;
}
