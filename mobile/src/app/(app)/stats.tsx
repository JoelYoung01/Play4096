import { getStats } from "@/api/stats";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { getTileBackground, getTileColor } from "@/game/Game";
import { formatChallengeElapsedMs } from "@/game/challenges";
import { getTileFontSize } from "@/game/tileAnimator";
import { formatWinDuration } from "@/lib/format";
import { formatRecord, formatStatNumber } from "@/lib/stats-format";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function StatsScreen() {
  const user = useSessionStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const { data, isLoading, error } = useQuery({ queryKey: ["stats"], queryFn: getStats, enabled: Boolean(user?.isPro) });

  if (!user) {
    return (
      <Screen title="Play Stats" subtitle="Personal records from your classic games and daily challenges.">
        <Text style={{ color: theme.textLight }}>Sign in to view your stats. Play stats are available for Pro players with a game history.</Text>
        <Link href="/(auth)/login" asChild>
          <Button>Log in</Button>
        </Link>
      </Screen>
    );
  }

  if (!user.isPro) {
    return (
      <Screen title="Play Stats" subtitle="Upgrade to Pro to unlock play stats, game history, and daily challenge archives.">
        <Link href="/(app)/pro" asChild>
          <Button>Upgrade to Pro</Button>
        </Link>
      </Screen>
    );
  }

  const stats = data?.stats;
  const empty = stats && stats.totalGames === 0 && stats.challengeAttempts === 0;
  const highest = stats?.highestTile ?? 0;

  return (
    <Screen title="Play Stats" subtitle="Personal records from your classic games and daily challenges.">
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: theme.destructive ?? theme.primary }}>Could not load stats.</Text> : null}

      {empty ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: theme.textLight }}>Play a classic game or today’s challenge — your records will show up here.</Text>
          <Link href="/(app)/(tabs)/game" asChild>
            <Button>Play classic</Button>
          </Link>
          <Link href="/(app)/(tabs)/challenges" asChild>
            <Button variant="secondary">Daily challenges</Button>
          </Link>
        </View>
      ) : null}

      {stats ? (
        <>
          <Text style={[styles.section, { color: theme.textLight }]}>Classic</Text>
          <View style={styles.grid}>
            <StatCard label="Highest tile">
              {highest > 0 ? (
                <View
                  style={[
                    styles.tile,
                    { backgroundColor: getTileBackground(highest, theme) }
                  ]}
                >
                  <Text style={{ color: getTileColor(highest, theme), fontWeight: "800", fontSize: getTileFontSize(highest, 72) }}>
                    {highest}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.value, { color: theme.text ?? theme.textLight }]}>—</Text>
              )}
            </StatCard>
            <StatCard label="Best score" value={formatStatNumber(stats.bestScore)} />
            <StatCard label="Least moves to win" value={formatStatNumber(stats.leastMovesToWin)} />
            <StatCard label="Fastest win" value={formatWinDuration(stats.fastestWinMs)} hint="Wall-clock start → finish" />
            <StatCard
              label="Win / loss"
              value={formatRecord(stats.wins, stats.losses)}
              hint={stats.winRate != null ? `${stats.winRate}% win rate` : "No finished games"}
            />
            <StatCard
              label="Games played"
              value={formatStatNumber(stats.totalGames, "0")}
              hint={`${stats.completedGames} finished${stats.activeGames > 0 ? ` · ${stats.activeGames} active` : ""}`}
            />
            <StatCard label="Avg score" value={formatStatNumber(stats.averageScore)} hint="Finished games" />
            <StatCard
              label="Total moves"
              value={formatStatNumber(stats.totalMoves, "0")}
              hint={stats.averageMovesPerWin != null ? `Avg ${stats.averageMovesPerWin.toLocaleString()} / win` : "Across all runs"}
            />
            <StatCard
              label="Win streak"
              value={formatStatNumber(stats.currentWinStreak, "0")}
              hint={`Best ${formatStatNumber(stats.longestWinStreak, "0")}`}
            />
          </View>

          <Text style={[styles.section, { color: theme.textLight }]}>Daily challenges</Text>
          <View style={styles.grid}>
            <StatCard
              label="Avg daily rank"
              value={stats.averageDailyChallengeRank != null ? `#${stats.averageDailyChallengeRank}` : "—"}
              hint={stats.rankedChallengeClears > 0 ? `Across ${stats.rankedChallengeClears} clears` : "Win a challenge to rank"}
            />
            <StatCard
              label="Challenge record"
              value={formatRecord(stats.challengeWins, stats.challengeLosses)}
              hint={stats.challengeWinRate != null ? `${stats.challengeWinRate}% clear rate` : "No finishes yet"}
            />
            <StatCard label="Best time clear" value={formatChallengeElapsedMs(stats.bestChallengeElapsedMs)} />
            <StatCard
              label="Best recovery"
              value={stats.bestChallengeMoveCount != null ? `${stats.bestChallengeMoveCount.toLocaleString()} moves` : "—"}
            />
            <StatCard
              wide
              label="Challenge attempts"
              value={formatStatNumber(stats.challengeAttempts, "0")}
              hint="Includes in-progress runs; abandoned retries are excluded"
            />
          </View>
        </>
      ) : null}

      <Link href="/(app)/history" asChild>
        <Button variant="secondary">Game history</Button>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  value: { fontSize: 24, fontWeight: "900" },
  tile: { width: 72, height: 72, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 6 }
});
