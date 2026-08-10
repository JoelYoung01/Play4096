import { getHistoryGame } from "@/api/game";
import { Board } from "@/components/Board";
import { Screen } from "@/components/Screen";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text } from "react-native";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const theme = useThemeStore((s) => s.theme); const { data, isLoading } = useQuery({ queryKey: ["history", id], queryFn: () => getHistoryGame(String(id)), enabled: Boolean(id) });
  return <Screen title="Game detail">{isLoading ? <ActivityIndicator /> : data?.game ? <><Text style={{ color: theme.text ?? theme.textLight, fontSize: 28, fontWeight: "900" }}>{Number(data.game.score ?? 0).toLocaleString()}</Text><Board board={data.game.board} /><Text style={{ color: theme.textLight }}>{data.replayable ? "Replay data available." : data.replayUnavailableReason || "Replay unavailable."}</Text></> : <Text style={{ color: theme.textLight }}>Game not found.</Text>}</Screen>;
}
