import { getChallenges } from "@/api/challenges";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function ChallengesScreen() {
  const theme = useThemeStore((s) => s.theme); const { data, isLoading, error } = useQuery({ queryKey: ["challenges"], queryFn: () => getChallenges() });
  return <Screen title="Challenges" subtitle="Daily challenge runs are Pro features. Today's challenge is visible to everyone.">{isLoading ? <ActivityIndicator /> : error ? <Text style={{ color: theme.destructive ?? theme.primary }}>Could not load challenges.</Text> : data ? <View style={[styles.card, { borderColor: theme.emptyTile }]}><Text style={[styles.title, { color: theme.text ?? theme.textLight }]}>{data.todayChallenge.title}</Text><Text style={{ color: theme.textLight }}>{data.todayChallenge.description}</Text><Text style={{ color: theme.primary, fontWeight: "800" }}>{data.todayChallenge.difficulty} • {data.today}</Text><Link href={`/(app)/challenge/${data.todayChallenge.id}`} asChild><Button>View challenge</Button></Link>{!data.isPro ? <Link href="/(app)/pro" asChild><Button variant="outline">Upgrade to play</Button></Link> : null}</View> : null}</Screen>;
}
const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 }, title: { fontSize: 22, fontWeight: "900" } });
