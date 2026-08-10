import { loginWithGoogle } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/config";
import { useSessionStore } from "@/stores/session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Button } from "./Button";

WebBrowser.maybeCompleteAuthSession();
type Props = { onPendingChange: (pending: boolean) => void; onError: (message: string) => void };

export function GoogleLoginButton(props: Props) {
  const available = Platform.OS === "web" ? Boolean(GOOGLE_WEB_CLIENT_ID) : Boolean(GOOGLE_IOS_CLIENT_ID);
  if (!available) return null;
  return <ConfiguredGoogleLoginButton {...props} />;
}
function ConfiguredGoogleLoginButton({ onPendingChange, onError }: Props) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ iosClientId: GOOGLE_IOS_CLIENT_ID || undefined, webClientId: GOOGLE_WEB_CLIENT_ID || undefined, clientId: GOOGLE_WEB_CLIENT_ID || undefined });
  const exchanging = useRef(false);
  useEffect(() => { if (!response) return; if (response.type === "success") { const idToken = response.params.id_token; if (!idToken) { onPendingChange(false); onError("Google sign-in did not return a credential."); return; } if (exchanging.current) return; exchanging.current = true; loginWithGoogle({ credential: idToken }).then((payload) => useSessionStore.getState().setSession(payload.access_token, payload.user)).catch((err) => onError(getErrorMessage(err, "Google sign-in failed"))).finally(() => { exchanging.current = false; onPendingChange(false); }); } else if (response.type === "error") { onPendingChange(false); onError(response.error?.message ?? "Google sign-in failed"); } else if (response.type === "cancel" || response.type === "dismiss") onPendingChange(false); }, [response, onPendingChange, onError]);
  return <Button variant="outline" disabled={!request} onPress={() => { onPendingChange(true); void promptAsync(); }}>Continue with Google</Button>;
}
