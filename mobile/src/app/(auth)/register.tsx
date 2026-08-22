import { registerWithPassword } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter(); const theme = useThemeStore((s) => s.theme); const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [displayName, setDisplayName] = useState(""); const [password, setPassword] = useState(""); const [pending, setPending] = useState(false);
  const submit = async () => { if (!username || !password) { Alert.alert("Missing details", "Username and password are required."); return; } setPending(true); try { const payload = await registerWithPassword({ username, password, email: email || undefined, displayName: displayName || undefined }); await useSessionStore.getState().setSession(payload); router.replace("/(app)/(tabs)/home"); } catch (err) { Alert.alert("Could not register", getErrorMessage(err)); } finally { setPending(false); } };
  const inputStyle = [styles.input, { borderColor: theme.emptyTile, color: theme.text ?? theme.textLight }];
  return <Screen title="Create account" subtitle="Save your best games and compete on the leaderboard."><View style={styles.card}><TextInput autoCapitalize="none" placeholder="Username" placeholderTextColor={theme.textLight} value={username} onChangeText={setUsername} style={inputStyle} /><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email (optional)" placeholderTextColor={theme.textLight} value={email} onChangeText={setEmail} style={inputStyle} /><TextInput placeholder="Display name (optional)" placeholderTextColor={theme.textLight} value={displayName} onChangeText={setDisplayName} style={inputStyle} /><TextInput placeholder="Password" placeholderTextColor={theme.textLight} value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} /><Button disabled={pending} onPress={() => void submit()}>{pending ? "Creating..." : "Create account"}</Button><Text style={{ color: theme.textLight, textAlign: "center" }}>Already have an account? <Link href="/(auth)/login" style={{ color: theme.primary, fontWeight: "800" }}>Sign in</Link></Text></View></Screen>;
}
const styles = StyleSheet.create({ card: { gap: 12 }, input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 16 } });
