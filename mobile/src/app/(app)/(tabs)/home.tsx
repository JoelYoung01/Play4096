import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme);
  return <Screen title="Play4096" subtitle="Merge tiles to reach 4096. Swipe anywhere on the board to play."><View style={[styles.hero, { backgroundColor: theme.boardBackground }]}><Text style={[styles.score, { color: theme.textDark }]}>{Number(user?.bestScore ?? 0).toLocaleString()}</Text><Text style={{ color: theme.textDark }}>Best score{user ? ` for ${user.displayName || user.username}` : ""}</Text></View><Link href="/(app)/(tabs)/game" asChild><Button>Play classic</Button></Link><Link href="/(app)/themes" asChild><Button variant="secondary">Choose theme</Button></Link><Link href="/(app)/stats" asChild><Button variant="outline">Stats & history</Button></Link>{!user ? <Text style={{ color: theme.textLight }}>Guest games are saved locally on this device. Sign in to sync across devices.</Text> : null}</Screen>;
}
const styles = StyleSheet.create({ hero: { borderRadius: 22, padding: 22, gap: 6 }, score: { fontSize: 48, fontWeight: "900" } });
