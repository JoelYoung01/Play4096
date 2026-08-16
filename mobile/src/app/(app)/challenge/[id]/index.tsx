import { getChallenge, getChallengeLeaderboard, startChallenge } from "@/api/challenges";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import {
  CHALLENGE_RUN_STATUS,
  CHALLENGE_TYPES,
  formatChallengeElapsedMs,
  formatChallengeOverview,
  formatChallengeTypeLabel
} from "@/game/challenges";
import { getInkColor } from "@/theme/themes";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 18)).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = String(id);
  const theme = useThemeStore((s) => s.theme);
  const user = useSessionStore((s) => s.user);
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
    enabled: Boolean(challengeId)
  });
  const leaders = useQuery({
    queryKey: ["challenge-leaderboard", challengeId],
    queryFn: () => getChallengeLeaderboard(challengeId),
    enabled: Boolean(challengeId)
  });

  const boardInk = getInkColor(theme.boardBackground, theme);
  const challenge = data?.challenge;
  const previewBoard = !data?.locked && Array.isArray(challenge?.params.board) ? (challenge?.params.board as number[][]) : null;
  const stats = data?.userStats;

  const begin = async () => {
    if (!user?.isPro || starting) return;
    setStarting(true);
    try {
      const started = await startChallenge(challengeId);
      router.push({ pathname: "/(app)/challenge/[id]/play", params: { id: challengeId, runId: started.runId } });
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) return <Screen title="Challenge"><ActivityIndicator /></Screen>;
  if (!challenge) return <Screen title="Challenge"><Text style={{ color: theme.textLight }}>Challenge not found.</Text></Screen>;

  return (
    <Screen>
      <Link href="/(app)/(tabs)/challenges" asChild>
        <Pressable style={styles.back}>
          <Icon name="arrowLeft" size={16} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: "700" }}>Calendar</Text>
        </Pressable>
      </Link>

      <Text style={[styles.kicker, { color: theme.textLight }]}>
        {data?.isToday || data?.date === undefined ? "Today's challenge" : "Daily challenge"}
        {data?.date ? ` · ${formatDate(data.date)}` : ""}
      </Text>
      <Text style={[styles.title, { color: theme.primary }]}>{challenge.title}</Text>

      {data?.locked ? (
        <View style={[styles.card, { backgroundColor: theme.boardBackground }]}>
          <Text style={{ color: boardInk, textAlign: "center" }}>
            Past daily challenges are a Pro feature — same archive pattern as game history.
          </Text>
          <Link href={user ? "/(app)/pro" : "/(auth)/login"} asChild>
            <Button>{user ? "Upgrade to Pro" : "Log in"}</Button>
          </Link>
        </View>
      ) : (
        <>
          <Text style={{ color: theme.textLight }}>
            {challenge.difficulty} · {formatChallengeTypeLabel(challenge.type)}
          </Text>
          <Text style={{ color: theme.text ?? theme.textLight, fontSize: 16 }}>
            {formatChallengeOverview(challenge)}
          </Text>

          {previewBoard ? (
            <View>
              <Text style={[styles.kicker, { color: theme.textLight }]}>Starting board</Text>
              <Board board={previewBoard} compact />
            </View>
          ) : null}

          {stats ? (
            <Text style={{ color: theme.textLight }}>
              {stats.bestStatus === CHALLENGE_RUN_STATUS.WON
                ? `You've cleared this challenge ${stats.wins ?? 0} time${stats.wins === 1 ? "" : "s"} (${stats.attempts ?? 0} attempt${stats.attempts === 1 ? "" : "s"}).${
                    challenge.type === CHALLENGE_TYPES.RECOVERY && stats.bestMoveCount != null
                      ? ` Best: ${stats.bestMoveCount} moves.`
                      : challenge.type === CHALLENGE_TYPES.TIME && stats.bestElapsedMs != null
                        ? ` Best time: ${formatChallengeElapsedMs(stats.bestElapsedMs)}.`
                        : ""
                  }`
                : (stats.attempts ?? 0) > 0
                  ? `${stats.attempts} attempt${stats.attempts === 1 ? "" : "s"} so far — keep going!`
                  : "No attempts yet."}
            </Text>
          ) : (
            <Text style={{ color: theme.textLight }}>No attempts yet.</Text>
          )}

          {user?.isPro ? (
            <Button disabled={starting} onPress={() => void begin()}>
              {starting ? "Starting…" : "Start Challenge"}
            </Button>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.boardBackground }]}>
              <Text style={{ color: boardInk, textAlign: "center" }}>
                {user ? "Upgrade to Pro to play daily challenges." : "Log in and upgrade to Pro to play daily challenges."}
              </Text>
              <Link href={user ? "/(app)/pro" : "/(auth)/login"} asChild>
                <Button>{user ? "Upgrade to Pro" : "Log in"}</Button>
              </Link>
            </View>
          )}

          <Pressable
            onPress={() => router.push(`/(app)/challenge/${challengeId}/leaderboard`)}
            style={[styles.leaderboard, { backgroundColor: theme.boardBackground }]}
          >
            <View style={[styles.trophy, { backgroundColor: theme.secondary }]}>
              <Icon name="trophy" color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: boardInk }]}>Global leaderboard</Text>
              <Text style={{ color: boardInk, fontWeight: "700" }}>
                {leaders.data?.entryCount
                  ? `${leaders.data.entryCount} clear${leaders.data.entryCount === 1 ? "" : "s"} — tap to view`
                  : "No clears yet — be the first"}
              </Text>
            </View>
            <Icon name="chevronRight" color={boardInk} />
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  kicker: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "900" },
  card: { borderRadius: 12, padding: 16, gap: 12 },
  leaderboard: { borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  trophy: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }
});
