import { getChallenge, getChallengeLeaderboard } from "@/api/challenges";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { CHALLENGE_TYPES, formatChallengeOverview, formatChallengeRankValue, formatChallengeTypeLabel } from "@/game/challenges";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function ChallengeLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = String(id);
  const theme = useThemeStore((s) => s.theme);
  const user = useSessionStore((s) => s.user);
  const { data: detail } = useQuery({ queryKey: ["challenge", challengeId], queryFn: () => getChallenge(challengeId), enabled: Boolean(challengeId) });
  const { data, isLoading } = useQuery({
    queryKey: ["challenge-leaderboard", challengeId],
    queryFn: () => getChallengeLeaderboard(challengeId),
    enabled: Boolean(challengeId)
  });
  const challenge = data?.challenge ?? detail?.challenge;
  const scoreLabel = challenge?.type === CHALLENGE_TYPES.RECOVERY ? "Moves" : "Time";

  return (
    <Screen title="Leaderboard">
      <Link href={`/(app)/challenge/${challengeId}`} asChild>
        <Pressable style={styles.back}>
          <Icon name="arrowLeft" size={16} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: "700" }}>Back to challenge</Text>
        </Pressable>
      </Link>
      {challenge ? (
        <>
          <Text style={[styles.title, { color: theme.primary }]}>{challenge.title}</Text>
          <Text style={{ color: theme.textLight }}>
            {challenge.difficulty} · {formatChallengeTypeLabel(challenge.type)} · {challenge.type === CHALLENGE_TYPES.RECOVERY ? "fewer moves ranks higher" : "faster time ranks higher"}
          </Text>
          <Text style={{ color: theme.textLight }}>{formatChallengeOverview(challenge)}</Text>
        </>
      ) : null}

      {isLoading ? <ActivityIndicator /> : null}
      {!isLoading && !data?.entries?.length ? (
        <Text style={{ color: theme.textLight }}>No clears yet for this day. Be the first on the board!</Text>
      ) : null}

      {data?.entries?.map((entry, i) => {
        const mine = Boolean(user && (entry.username === user.username || entry.displayName === user.displayName));
        return (
          <View key={`${entry.username}-${i}`} style={[styles.row, { borderColor: theme.emptyTile }]}>
            <Text style={[styles.rank, { color: theme.primary }]}>{entry.rank ?? i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>
                {entry.displayName || entry.username || "Player"}
                {mine ? "  · You" : ""}
              </Text>
              <Text style={{ color: theme.textLight }}>
                {scoreLabel}: {formatChallengeRankValue(challenge?.type ?? "time", Number(entry.score ?? entry.bestScore ?? entry.value ?? 0))}
              </Text>
            </View>
          </View>
        );
      })}

      {typeof data?.userRank === "number" &&
      data.userBestScore != null &&
      !data.entries?.some((entry) => entry.username === user?.username) ? (
        <View style={[styles.row, { borderColor: theme.primary }]}>
          <Text style={[styles.rank, { color: theme.primary }]}>{data.userRank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text ?? theme.textLight }]}>
              {user?.displayName || user?.username}  · You
            </Text>
            <Text style={{ color: theme.textLight }}>
              {scoreLabel}: {formatChallengeRankValue(challenge?.type ?? "time", Number(data.userBestScore))}
            </Text>
          </View>
        </View>
      ) : null}

      <Link href={`/(app)/challenge/${challengeId}`} asChild>
        <Button variant="outline">Back</Button>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontSize: 28, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, padding: 14, gap: 14 },
  rank: { fontSize: 20, fontWeight: "900", width: 34 },
  name: { fontSize: 16, fontWeight: "800" }
});
