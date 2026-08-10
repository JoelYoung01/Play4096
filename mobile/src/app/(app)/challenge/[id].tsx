import { getChallenge, getChallengeLeaderboard } from "@/api/challenges";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { formatChallengeObjective } from "@/game/challenges";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const theme = useThemeStore((s) => s.theme); const challengeId = String(id);
  const { data, isLoading } = useQuery({ queryKey: ["challenge", challengeId], queryFn: () => getChallenge(challengeId), enabled: Boolean(challengeId) });
  const leaders = useQuery({ queryKey: ["challenge-leaderboard", challengeId], queryFn: () => getChallengeLeaderboard(challengeId), enabled: Boolean(challengeId) });
  if (isLoading) return <Screen title="Challenge"><ActivityIndicator /></Screen>;
  if (!data?.challenge) return <Screen title="Challenge"><Text style={{ color: theme.textLight }}>Challenge not found.</Text></Screen>;
  return <Screen title={data.challenge.title} subtitle={data.challenge.description}><Text style={[styles.meta, { color: theme.primary }]}>{data.challenge.difficulty} • {formatChallengeObjective(data.challenge)}</Text>{data.locked ? <Link href="/(app)/pro" asChild><Button>Upgrade to play past challenges</Button></Link> : <Link href={`/(app)/challenge/${challengeId}/play`} asChild><Button>Play challenge</Button></Link>}<View style={{ gap: 8 }}><Text style={[styles.section, { color: theme.text ?? theme.textLight }]}>Leaderboard</Text>{leaders.data?.entries?.slice(0, 5).map((entry, i) => <Text key={i} style={{ color: theme.textLight }}>{entry.rank ?? i + 1}. {entry.displayName || entry.username || "Player"} - {Number(entry.score ?? entry.value ?? 0).toLocaleString()}</Text>) ?? <Text style={{ color: theme.textLight }}>No entries yet.</Text>}</View></Screen>;
}
const styles = StyleSheet.create({ meta: { fontWeight: "900", fontSize: 16 }, section: { fontSize: 18, fontWeight: "900" } });
