import { getHistory } from "@/api/game";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme); const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: () => getHistory(), enabled: Boolean(user?.isPro) });
  if (!user?.isPro) return <Screen title="History" subtitle="Game history is available with Pro."><Link href="/(app)/pro" asChild><Button>Upgrade to Pro</Button></Link></Screen>;
  return <Screen title="History">{isLoading ? <ActivityIndicator /> : data?.games?.length ? data.games.map((g, i) => <Link key={String(g.id ?? i)} href={`/(app)/history/${String(g.id)}`} asChild><Button variant="outline" style={styles.row}><View style={{ flex: 1 }}><Text style={{ color: theme.primary, fontWeight: "900" }}>{Number(g.score ?? 0).toLocaleString()}</Text><Text style={{ color: theme.textLight }}>{g.won ? "Won" : g.complete ? "Complete" : "In progress"}</Text></View></Button></Link>) : <Text style={{ color: theme.textLight }}>No games yet.</Text>}</Screen>;
}
const styles = StyleSheet.create({ row: { justifyContent: "flex-start", alignItems: "stretch" } });
