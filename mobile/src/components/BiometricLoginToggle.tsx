import { getBiometricSupport, type BiometricSupport } from "@/lib/biometrics";
import {
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricLoginEnabled
} from "@/lib/biometric-login";
import { useThemeStore } from "@/stores/theme";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Button } from "./Button";

/**
 * Lets signed-in password users turn Face ID / Touch ID sign-in on or off.
 * Enabling asks for the current password once, then stores it behind biometrics.
 */
export function BiometricLoginToggle({ username }: { username: string }) {
  const theme = useThemeStore((s) => s.theme);
  const [support, setSupport] = useState<BiometricSupport | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [askingPassword, setAskingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextSupport = await getBiometricSupport();
      const nextEnabled = await isBiometricLoginEnabled();
      if (!cancelled) {
        setSupport(nextSupport);
        setEnabled(nextEnabled);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!support?.available) return null;

  const onToggle = async (on: boolean) => {
    if (busy) return;
    if (on) {
      setAskingPassword(true);
      return;
    }
    setBusy(true);
    try {
      await disableBiometricLogin();
      setEnabled(false);
      setAskingPassword(false);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (busy) return;
    if (!password) {
      Alert.alert("Password required", `Enter your password to enable ${support.label} sign-in.`);
      return;
    }
    setBusy(true);
    try {
      const ok = await enableBiometricLogin(username, password);
      if (!ok) {
        Alert.alert("Could not enable", `Try again to turn on ${support.label} sign-in.`);
        return;
      }
      setEnabled(true);
      setAskingPassword(false);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.border ?? theme.emptyTile,
          backgroundColor: theme.boardBackground
        }
      ]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textDark }]}>{support.label} sign-in</Text>
          <Text style={{ color: theme.textDark }}>
            Optional shortcut for rare re-logins. Your session already lasts for months.
          </Text>
        </View>
        <Switch
          value={enabled || askingPassword}
          disabled={busy}
          onValueChange={(v) => void onToggle(v)}
          trackColor={{ false: theme.emptyTile, true: theme.primary }}
        />
      </View>
      {askingPassword && !enabled ? (
        <View style={styles.enableBox}>
          <TextInput
            placeholder="Current password"
            placeholderTextColor={theme.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { borderColor: theme.emptyTile, color: theme.text ?? theme.textLight }]}
          />
          <View style={styles.actions}>
            <Button
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setAskingPassword(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button disabled={busy} onPress={() => void confirmEnable()}>
              {busy ? "Saving..." : `Enable ${support.label}`}
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  enableBox: { gap: 10 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 16 },
  actions: { gap: 8 }
});
