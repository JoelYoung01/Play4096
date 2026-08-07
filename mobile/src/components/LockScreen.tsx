import { APP_NAME } from "@/config";
import { authenticateBiometric, getBiometricSupport } from "@/lib/biometrics";
import { queryClient } from "@/lib/query-client";
import { useAppLockStore } from "@/stores/app-lock";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";

export function LockScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets(); const theme = useThemeStore((s) => s.theme);
  const [label, setLabel] = useState("Face ID"); const [prompting, setPrompting] = useState(false); const [failed, setFailed] = useState(false); const attempted = useRef(false);
  const tryUnlock = async () => { if (prompting) return; setPrompting(true); setFailed(false); try { const ok = await authenticateBiometric(`Unlock ${APP_NAME}`); if (ok) useAppLockStore.getState().unlock(); else setFailed(true); } catch { setFailed(true); } finally { setPrompting(false); } };
  useEffect(() => { void getBiometricSupport().then((s) => setLabel(s.label)); if (!attempted.current) { attempted.current = true; void tryUnlock(); } }, []);
  const signOut = async () => { useAppLockStore.getState().unlock(); await useSessionStore.getState().clear(); queryClient.clear(); router.replace("/(auth)/login"); };
  return <View style={[StyleSheet.absoluteFill, styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.background }]}><View style={styles.center}><Text style={[styles.logo, { color: theme.primary }]}>4096</Text><Text style={[styles.title, { color: theme.text ?? theme.textLight }]}>{APP_NAME} locked</Text>{failed ? <Text style={{ color: theme.destructive ?? theme.primary }}>Could not verify it is you. Try again.</Text> : null}<Button disabled={prompting} onPress={() => void tryUnlock()}>{prompting ? "Unlocking..." : `Unlock with ${label}`}</Button></View><Button variant="ghost" onPress={() => void signOut()}>Sign out</Button></View>;
}
const styles = StyleSheet.create({ wrap: { zIndex: 999, paddingHorizontal: 24, justifyContent: "space-between" }, center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 18 }, logo: { fontSize: 52, fontWeight: "900" }, title: { fontSize: 22, fontWeight: "800" } });
