import { completeChallenge, getChallenge, startChallenge } from "@/api/challenges";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { DIRECTIONS } from "@/game/constants";
import { evaluateChallenge, formatChallengeObjective } from "@/game/challenges";
import { Game } from "@/game/Game";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, PanResponder, StyleSheet, Text, View } from "react-native";

export default function ChallengePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const challengeId = String(id); const user = useSessionStore((s) => s.user); const theme = useThemeStore((s) => s.theme); const [game, setGame] = useState<Game | null>(null); const [runId, setRunId] = useState<string | null>(null); const [startMs] = useState(Date.now()); const [, force] = useState(0); const completing = useRef(false);
  const { data, isLoading } = useQuery({ queryKey: ["challenge", challengeId], queryFn: () => getChallenge(challengeId), enabled: Boolean(challengeId) });
  const begin = async () => { if (!user?.isPro) return; const started = await startChallenge(challengeId); setRunId(started.runId); const params = started.challenge.params; setGame(new Game({ seed: Number(params.seed ?? undefined), initialState: Array.isArray(params.board) ? { board: params.board as number[][], score: 0, seed: Number(params.seed ?? undefined) } : null, winTile: Number(params.winTile ?? 4096) })); };
  const commit = (direction: number) => { if (!game || !data?.challenge || completing.current) return; const events = game.moveTiles(direction); if (!events.length) return; force((n) => n + 1); const result = evaluateChallenge(data.challenge, { board: game.board, score: game.score, gameOver: game.gameOver, won: game.won, elapsedMs: Date.now() - startMs }); if (result !== "ongoing" && runId) { completing.current = true; completeChallenge(challengeId, { runId, status: result, score: game.score, metrics: { moveCount: game.moveCount, elapsedMs: Date.now() - startMs } }).catch(() => undefined); Alert.alert(result === "won" ? "Challenge complete" : "Challenge failed", `Score: ${game.score.toLocaleString()}`); } };
  const responder = useMemo(() => PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 || Math.abs(g.dy) > 12, onPanResponderRelease: (_, g) => { const ax = Math.abs(g.dx), ay = Math.abs(g.dy); if (Math.max(ax, ay) < 32) return; commit(ax > ay ? (g.dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT) : (g.dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP)); } }), [game, data?.challenge, runId]);
  if (isLoading) return <Screen title="Challenge"><ActivityIndicator /></Screen>;
  if (!user?.isPro) return <Screen title="Challenge" subtitle="Challenge play is a Pro feature."><Link href="/(app)/pro" asChild><Button>Upgrade to Pro</Button></Link></Screen>;
  if (!data?.challenge) return <Screen title="Challenge"><Text style={{ color: theme.textLight }}>Challenge not found.</Text></Screen>;
  return <Screen title={data.challenge.title} scroll={false}><Text style={{ color: theme.textLight }}>{formatChallengeObjective(data.challenge)}</Text>{game ? <><View style={styles.stats}><Text style={[styles.score, { color: theme.text ?? theme.textLight }]}>{game.score.toLocaleString()}</Text><Text style={{ color: theme.textLight }}>{game.moveCount} moves</Text></View><View {...responder.panHandlers}><Board board={game.board} /></View><Button variant="outline" onPress={() => { setGame(null); setRunId(null); }}>Stop run</Button></> : <Button onPress={() => void begin()}>Start challenge</Button>}</Screen>;
}
const styles = StyleSheet.create({ stats: { alignItems: "center" }, score: { fontSize: 38, fontWeight: "900" } });
