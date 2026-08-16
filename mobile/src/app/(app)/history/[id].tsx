import { getHistoryGame } from "@/api/game";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { Game } from "@/game/Game";
import { useAnimatedBoard } from "@/hooks/useAnimatedBoard";
import { useThemeStore } from "@/stores/theme";
import type { GameEvent } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const SPEEDS = [1, 2, 4, 8];

function ReplayPlayer({ seed, moves, score }: { seed: number; moves: number[]; score: number }) {
  const theme = useThemeStore((s) => s.theme);
  const [generation, setGeneration] = useState(0);
  const [replay, setReplay] = useState(() => new Game({ seed }));
  const [moveIndex, setMoveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const { tiles, idle, playEvents, syncBoard } = useAnimatedBoard(replay);
  const total = moves.length;
  const atEnd = moveIndex >= total;

  const reset = () => {
    setPlaying(false);
    setMoveIndex(0);
    setReplay(new Game({ seed }));
    setGeneration((n) => n + 1);
  };

  const stepForward = useCallback(() => {
    if (!replay || atEnd || !idle) return false;
    const events = replay.applyRecordedAction(moves[moveIndex]) as GameEvent[];
    if (!events.length) {
      setPlaying(false);
      return false;
    }
    playEvents(events);
    setMoveIndex((n) => n + 1);
    return true;
  }, [atEnd, idle, moveIndex, moves, playEvents, replay]);

  useEffect(() => {
    if (!playing || !idle || atEnd) return;
    const timer = setTimeout(() => {
      if (!stepForward()) setPlaying(false);
    }, Math.max(16, 140 / speed));
    return () => clearTimeout(timer);
  }, [atEnd, idle, playing, speed, stepForward]);

  return (
    <View key={generation} style={{ gap: 12 }}>
      <View style={styles.meta}>
        <Text style={[styles.score, { color: theme.text ?? theme.textLight }]}>{score.toLocaleString()}</Text>
        <Text style={{ color: theme.textLight }}>
          {Math.min(moveIndex, total)} / {total} moves
        </Text>
      </View>
      <Board board={replay.board} tiles={tiles} />
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Reset"
          onPress={() => {
            reset();
            syncBoard();
          }}
          style={[styles.ctl, { backgroundColor: theme.secondary }]}
        >
          <Icon name="undo" color={theme.text ?? theme.textLight} />
        </Pressable>
        <Pressable
          accessibilityLabel={playing ? "Pause" : "Play"}
          onPress={() => {
            if (atEnd) {
              reset();
              setPlaying(true);
              return;
            }
            setPlaying((on) => !on);
          }}
          style={[styles.ctl, { backgroundColor: theme.primary }]}
        >
          <Icon name={playing ? "pause" : "play"} color={theme.textDark} />
        </Pressable>
        <Pressable
          accessibilityLabel="Step forward"
          onPress={() => {
            setPlaying(false);
            stepForward();
          }}
          style={[styles.ctl, { backgroundColor: theme.secondary }]}
        >
          <Icon name="skip" color={theme.text ?? theme.textLight} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Speed ${speed}x`}
          onPress={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          style={[styles.ctl, { backgroundColor: theme.secondary }]}
        >
          <Text style={{ color: theme.text ?? theme.textLight, fontWeight: "900" }}>{speed}x</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeStore((s) => s.theme);
  const { data, isLoading } = useQuery({
    queryKey: ["history", id],
    queryFn: () => getHistoryGame(String(id)),
    enabled: Boolean(id)
  });

  if (isLoading) return <Screen title="Replay"><ActivityIndicator /></Screen>;
  if (!data?.game) return <Screen title="Replay"><Text style={{ color: theme.textLight }}>Game not found.</Text></Screen>;

  const moves = Array.isArray(data.game.moves) ? data.game.moves : [];
  const seed = data.game.seed;

  return (
    <Screen title="Replay" scroll={!data.replayable}>
      <Link href="/(app)/history" asChild>
        <Pressable style={styles.back}>
          <Icon name="arrowLeft" size={16} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: "700" }}>History</Text>
        </Pressable>
      </Link>
      {data.replayable && seed != null ? (
        <ReplayPlayer seed={Number(seed)} moves={moves} score={Number(data.game.score ?? 0)} />
      ) : (
        <>
          <Text style={{ color: theme.textLight }}>{data.replayUnavailableReason || "Move history isn't available for this game."}</Text>
          <Text style={[styles.score, { color: theme.text ?? theme.textLight }]}>{Number(data.game.score ?? 0).toLocaleString()}</Text>
          <Board board={data.game.board} />
          <Link href="/(app)/history" asChild>
            <Button variant="outline">Back to history</Button>
          </Link>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  score: { fontSize: 28, fontWeight: "900" },
  controls: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8 },
  ctl: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }
});
