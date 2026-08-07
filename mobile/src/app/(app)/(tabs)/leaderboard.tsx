import { getAllTimeLeaderboard, getPeriodLeaderboard } from "@/api/leaderboard";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const periods = ["all-time", "daily", "weekly", "monthly"];
export default function LeaderboardScreen() {
  const [period, setPeriod] = useState("all-time"); const theme = useThemeStore((s) => s.theme); const { data, isLoading } = useQuery({ queryKey: ["leaderboard", period], queryFn: () => period === "all-time" ? getAllTimeLeaderboard() : getPeriodLeaderboard(period) });
  return <Screen title="Leaderboard"><View style={styles.tabs}>{periods.map((p) => <Button key={p} variant={period === p ? "primary" : "outline"} style={{ flex: 1, minHeight: 38, paddingHorizontal: 8 }} textStyle={{ fontSize: 12 } as any} onPress={() => setPeriod(p)}>{p.replace("-", " ")}</Button>)}</View>{isLoading ? <ActivityIndicator /> : data?.entries?.length ? data.entries.map((entry, i) => <View key={`${entry.username}-${i}`} style={[styles.row, { borderColor: theme.emptyTile }]}><Text style={[styles.rank, { color: theme.primary }]}>{entry.rank ?? i + 1}</Text><View style={{ flex: 1 }}><Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>{entry.displayName || entry.username || "Player"}</Text><Text style={{ color: theme.textLight }}>{Number(entry.score ?? entry.bestScore ?? entry.value ?? 0).toLocaleString()}</Text></View></View>) : <Text style={{ color: theme.textLight }}>No scores yet.</Text>}</Screen>;
}
const styles = StyleSheet.create({ tabs: { flexDirection: "row", gap: 8 }, row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, padding: 14, gap: 14 }, rank: { fontSize: 20, fontWeight: "900", width: 34 }, name: { fontSize: 16, fontWeight: "800" } });
