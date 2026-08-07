import { getStats } from "@/api/stats";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function StatsScreen() {
  const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme); const { data, isLoading, error } = useQuery({ queryKey: ["stats"], queryFn: getStats, enabled: Boolean(user?.isPro) });
  if (!user?.isPro) return <Screen title="Stats" subtitle="Detailed stats and game history are Pro features."><Link href="/(app)/pro" asChild><Button>Upgrade to Pro</Button></Link></Screen>;
  return <Screen title="Stats">{isLoading ? <ActivityIndicator /> : error ? <Text style={{ color: theme.destructive ?? theme.primary }}>Could not load stats.</Text> : <View style={{ gap: 12 }}>{Object.entries(data?.stats ?? {}).map(([key, value]) => <View key={key}><Text style={{ color: theme.textLight, textTransform: "uppercase", fontWeight: "800" }}>{key}</Text><Text style={{ color: theme.text ?? theme.textLight, fontSize: 24, fontWeight: "900" }}>{String(value)}</Text></View>)}</View>}<Link href="/(app)/history" asChild><Button variant="secondary">Game history</Button></Link></Screen>;
}
