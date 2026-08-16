import { getHistory } from "@/api/game";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { formatHistoryDate, historyStatusLabel } from "@/lib/stats-format";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import type { HistoryFilter, HistorySort } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const filters: { key: HistoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "won", label: "Wins" },
  { key: "lost", label: "Losses" }
];
const sorts: { key: HistorySort; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "score", label: "Score" },
  { key: "moves", label: "Moves" }
];

export default function HistoryScreen() {
  const user = useSessionStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sort, setSort] = useState<HistorySort>("date");
  const { data, isLoading } = useQuery({
    queryKey: ["history", sort, filter],
    queryFn: () => getHistory({ sort, filter }),
    enabled: Boolean(user?.isPro)
  });

  if (!user) {
    return (
      <Screen title="Game History" subtitle="Game history and replay are available for Pro players.">
        <Link href="/(auth)/login" asChild>
          <Button>Log in</Button>
        </Link>
      </Screen>
    );
  }
  if (!user.isPro) {
    return (
      <Screen title="Game History" subtitle="Upgrade to Pro to browse past games and watch move-by-move replays.">
        <Link href="/(app)/pro" asChild>
          <Button>Upgrade to Pro</Button>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen title="Game History" subtitle="Active and finished games — continue your current run or replay moves so far.">
      <View style={[styles.seg, { backgroundColor: theme.secondary }]}>
        {filters.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setFilter(option.key)}
            style={[styles.segItem, filter === option.key ? { backgroundColor: theme.primary } : null]}
          >
            <Text style={{ color: filter === option.key ? theme.textDark : theme.textLight, fontWeight: "800", fontSize: 13 }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sortRow}>
        <Text style={{ color: theme.textLight }}>Sort:</Text>
        {sorts.map((option) => (
          <Pressable key={option.key} onPress={() => setSort(option.key)} style={[styles.sortChip, sort === option.key ? { backgroundColor: theme.secondary } : null]}>
            <Text style={{ color: sort === option.key ? (theme.text ?? theme.textLight) : theme.textLight, fontWeight: "700" }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? <ActivityIndicator /> : null}
      {!isLoading && !data?.games?.length ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: theme.textLight }}>Play a game and it will show up here — including your active run.</Text>
          <Link href="/(app)/(tabs)/game" asChild>
            <Button>Play a game</Button>
          </Link>
        </View>
      ) : null}

      {data?.games?.map((game) => {
        const label = historyStatusLabel(game);
        const tone = label === "WIN" ? (theme.challengeWon ?? "#059669") : label === "LOSS" ? (theme.challengeLost ?? "#9f1239") : theme.primary;
        return (
          <View key={game.id} style={[styles.row, { borderColor: theme.emptyTile }]}>
            <View style={[styles.badge, { backgroundColor: tone }]}>
              <Text style={styles.badgeText}>{label}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.score, { color: theme.text ?? theme.textLight }]}>{Number(game.score ?? 0).toLocaleString()}</Text>
              <Text style={{ color: theme.textLight, fontSize: 12 }}>
                {game.moveCount} moves · {formatHistoryDate(game.updatedOn)}
              </Text>
            </View>
            {game.status === "active" ? (
              <Button variant="secondary" style={styles.small} onPress={() => router.push("/(app)/(tabs)/game")}>
                Continue
              </Button>
            ) : null}
            {game.hasReplay ? (
              <Button style={styles.small} onPress={() => router.push(`/(app)/history/${game.id}`)}>
                Replay
              </Button>
            ) : game.status !== "active" ? (
              <Pressable onPress={() => router.push(`/(app)/history/${game.id}`)} accessibilityLabel="Why no replay?">
                <Icon name="help" color={theme.textLight} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", borderRadius: 10, padding: 4, gap: 4 },
  segItem: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sortChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  badge: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  score: { fontSize: 18, fontWeight: "900" },
  small: { minHeight: 36, paddingHorizontal: 10 }
});
