import { Button } from "@/components/Button";
import { AppLockToggle } from "@/components/AppLockToggle";
import { Screen } from "@/components/Screen";
import { queryClient } from "@/lib/query-client";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function AccountScreen() {
  const router = useRouter(); const user = useSessionStore((s) => s.user); const status = useSessionStore((s) => s.status); const theme = useThemeStore((s) => s.theme);
  const signOut = async () => { await useSessionStore.getState().logout(); queryClient.clear(); router.replace("/(auth)/login"); };
  if (status !== "authed") return <Screen title="Account" subtitle="Create an account to sync progress and unlock Pro."><Link href="/(auth)/login" asChild><Button>Sign in</Button></Link></Screen>;
  return <Screen title="Account"><View style={[styles.card, { borderColor: theme.emptyTile }]}><Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>{user?.displayName || user?.username}</Text><Text style={{ color: theme.textLight }}>{user?.email || "No email on file"}</Text><Text style={{ color: theme.primary, fontWeight: "900" }}>{user?.isPro ? "Pro" : "Free"}</Text></View><AppLockToggle /><Link href="/(app)/pro" asChild><Button>{user?.isPro ? "Manage Pro" : "Upgrade to Pro"}</Button></Link><Link href="/(app)/themes" asChild><Button variant="secondary">Themes</Button></Link><Button variant="outline" onPress={() => void signOut()}>Logout</Button><Button variant="danger" onPress={() => Alert.alert("Delete account", "Use the web account page for irreversible deletion.")}>Delete account</Button></Screen>;
}
const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 6 }, name: { fontSize: 24, fontWeight: "900" } });
