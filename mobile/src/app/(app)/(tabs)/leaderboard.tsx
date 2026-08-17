import { getAllTimeLeaderboard, getPeriodLeaderboard } from "@/api/leaderboard";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const periods = [
  { key: "all-time", label: "All Time" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" }
];

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState("all-time");
  const theme = useThemeStore((s) => s.theme);
  const user = useSessionStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => (period === "all-time" ? getAllTimeLeaderboard() : getPeriodLeaderboard(period))
  });
  const showUserRow =
    data?.userRank != null &&
    data.userBestScore != null &&
    Boolean(user?.isPro) &&
    !data.entries?.some((entry) => entry.username === user?.username);

  return (
    <Screen title="Leaderboard" subtitle="Classic high scores by time frame.">
      <View style={[styles.tabs, { backgroundColor: theme.secondary }]}>
        {periods.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setPeriod(item.key)}
            style={[styles.tab, period === item.key ? { backgroundColor: theme.primary } : null]}
          >
            <Text style={{ color: period === item.key ? theme.textDark : theme.textLight, fontWeight: "800", fontSize: 12, textAlign: "center" }}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <ActivityIndicator /> : null}
      {data?.entries?.length
        ? data.entries.map((entry, i) => {
            const mine = Boolean(user && (entry.username === user.username || entry.displayName === user.displayName));
            return (
              <View key={`${entry.username}-${i}`} style={[styles.row, { borderColor: theme.emptyTile }]}>
                <Text style={[styles.rank, { color: theme.primary }]}>{entry.rank ?? i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>
                    {entry.displayName || entry.username || "Player"}
                    {mine ? "  · You" : ""}
                  </Text>
                  <Text style={{ color: theme.textLight }}>{Number(entry.score ?? entry.bestScore ?? entry.value ?? 0).toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        : !isLoading
          ? <Text style={{ color: theme.textLight }}>No scores yet.</Text>
          : null}
      {showUserRow ? (
        <View style={[styles.row, { borderColor: theme.primary }]}>
          <Text style={[styles.rank, { color: theme.primary }]}>{data?.userRank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>{user?.displayName || user?.username}</Text>
            <Text style={{ color: theme.textLight }}>{Number(data?.userBestScore ?? 0).toLocaleString()}</Text>
          </View>
        </View>
      ) : null}
      {!user?.isPro ? (
        <Text style={{ color: theme.textLight, textAlign: "center" }}>
          Want to see your name on the leaderboard? Upgrade to Pro to show off your skills.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderRadius: 10, padding: 4, gap: 4 },
  tab: { flex: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, padding: 14, gap: 14 },
  rank: { fontSize: 20, fontWeight: "900", width: 34 },
  name: { fontSize: 16, fontWeight: "800" }
});
