import { APP_NAME } from "@/config";
import { authenticateBiometric, getBiometricSupport, type BiometricSupport } from "@/lib/biometrics";
import { useAppLockStore } from "@/stores/app-lock";
import { useThemeStore } from "@/stores/theme";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

export function AppLockToggle() {
  const enabled = useAppLockStore((s) => s.enabled); const theme = useThemeStore((s) => s.theme); const [support, setSupport] = useState<BiometricSupport | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { let cancelled = false; void getBiometricSupport().then((s) => !cancelled && setSupport(s)); return () => { cancelled = true; }; }, []);
  if (!support?.available) return null;
  const onToggle = async (on: boolean) => { if (busy) return; setBusy(true); try { if (on) { const ok = await authenticateBiometric(`Enable ${support.label} unlock`); if (!ok) { Alert.alert("Could not verify", "Try again to enable biometric unlock."); return; } } await useAppLockStore.getState().setEnabled(on); } finally { setBusy(false); } };
  return <View style={[styles.card, { borderColor: theme.border ?? theme.emptyTile, backgroundColor: theme.boardBackground }]}><View style={{ flex: 1 }}><Text style={[styles.title, { color: theme.textDark }]}>{support.label} unlock</Text><Text style={{ color: theme.textDark }}>Require {support.label} when opening {APP_NAME}</Text></View><Switch value={enabled} disabled={busy} onValueChange={(v) => void onToggle(v)} trackColor={{ false: theme.emptyTile, true: theme.primary }} /></View>;
}
const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }, title: { fontSize: 16, fontWeight: "800", marginBottom: 4 } });
