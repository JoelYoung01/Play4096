import { completeChallenge, getChallenge, startChallenge } from "@/api/challenges";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { GameOverlay } from "@/components/GameOverlay";
import { Screen } from "@/components/Screen";
import {
  CHALLENGE_TYPES,
  challengeCompleteScore,
  countFilledCells,
  evaluateChallenge,
  formatChallengeElapsedMs,
  formatChallengeObjective
} from "@/game/challenges";
import { Game } from "@/game/Game";
import { useAnimatedBoard } from "@/hooks/useAnimatedBoard";
import { useBoardSwipe } from "@/hooks/useBoardSwipe";
import { formatCountdown } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { getInkColor } from "@/theme/themes";
import type { GameEvent } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

const GAME_OVER_DELAY_MS = 1200;

function createChallengeGame(challenge: { type: string; params: Record<string, unknown> }) {
  const seed = Number(challenge.params.seed ?? undefined);
  const winTile = challenge.type === CHALLENGE_TYPES.RECOVERY ? Number(challenge.params.winTile ?? 4096) : undefined;
  if (Array.isArray(challenge.params.board)) {
    return new Game({
      seed,
      winTile,
      initialState: {
        board: (challenge.params.board as number[][]).map((row) => [...row]),
        score: 0,
        seed,
        moveCount: 0,
        undoCooldownRemaining: 0
      }
    });
  }
  return new Game({ seed, winTile });
}

export default function ChallengePlayScreen() {
  const { id, runId: runIdParam } = useLocalSearchParams<{ id: string; runId?: string }>();
  const challengeId = String(id);
  const user = useSessionStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [runId, setRunId] = useState<string | null>(runIdParam ? String(runIdParam) : null);
  const [startMs, setStartMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [result, setResult] = useState<"won" | "lost" | null>(null);
  const [pendingLoss, setPendingLoss] = useState(false);
  const [finishedElapsedMs, setFinishedElapsedMs] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const completing = useRef(false);
  const { data, isLoading } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
    enabled: Boolean(challengeId)
  });
  const { tiles, playEvents } = useAnimatedBoard(game);
  const challenge = data?.challenge;
  const isTime = challenge?.type === CHALLENGE_TYPES.TIME;
  const isRecovery = challenge?.type === CHALLENGE_TYPES.RECOVERY;
  const boardInk = getInkColor(theme.boardBackground, theme);
  const urgentInk = theme.destructive ?? "#b91c1c";

  const startRun = useCallback(async (reuseRunId?: string | null) => {
    if (!user?.isPro || !challenge) return;
    const started = reuseRunId ? { runId: reuseRunId, challenge } : await startChallenge(challengeId);
    setRunId(started.runId);
    setStartMs(Date.now());
    setResult(null);
    setPendingLoss(false);
    setFinishedElapsedMs(null);
    completing.current = false;
    const next = createChallengeGame(started.challenge);
    setGame(next);
    if (started.challenge.type === CHALLENGE_TYPES.TIME) {
      setRemainingMs(Number(started.challenge.params.durationSec ?? 0) * 1000);
    }
  }, [challenge, challengeId, user?.isPro]);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (!challenge || !user?.isPro || bootstrapped.current) return;
    bootstrapped.current = true;
    void startRun(runIdParam ? String(runIdParam) : null);
  }, [challenge, runIdParam, startRun, user?.isPro]);

  const finish = useCallback(
    (status: "won" | "lost") => {
      if (!game || !challenge || !runId || completing.current) return;
      completing.current = true;
      const elapsedMs = finishedElapsedMs ?? Math.max(0, Date.now() - startMs);
      setFinishedElapsedMs(elapsedMs);
      setResult(status);
      setPendingLoss(false);
      void completeChallenge(challengeId, {
        runId,
        status,
        score: challengeCompleteScore(challenge, { score: game.score, moveCount: game.moveCount, elapsedMs }),
        metrics: {
          moveCount: game.moveCount,
          filledCells: countFilledCells(game.board),
          elapsedMs,
          mergeScore: game.score
        }
      }).catch(() => undefined);
    },
    [challenge, challengeId, finishedElapsedMs, game, runId, startMs]
  );

  const checkOutcome = useCallback(() => {
    if (!game || !challenge || result || pendingLoss) return;
    const elapsedMs = Date.now() - startMs;
    const outcome = evaluateChallenge(challenge, {
      board: game.board,
      score: game.score,
      gameOver: game.gameOver,
      won: game.won,
      elapsedMs
    });
    if (outcome === "won") finish("won");
    else if (outcome === "lost") {
      setFinishedElapsedMs(elapsedMs);
      setPendingLoss(true);
      setTimeout(() => finish("lost"), GAME_OVER_DELAY_MS);
    }
  }, [challenge, finish, game, pendingLoss, result, startMs]);

  useEffect(() => {
    if (!isTime || !challenge || result) return;
    const durationMs = Number(challenge.params.durationSec ?? 0) * 1000;
    const timer = setInterval(() => {
      setRemainingMs(Math.max(0, durationMs - (Date.now() - startMs)));
      checkOutcome();
    }, 200);
    return () => clearInterval(timer);
  }, [challenge, checkOutcome, isTime, result, startMs]);

  const commit = useCallback(
    (direction: number) => {
      if (!game || !challenge || result || pendingLoss) return;
      const events = game.moveTiles(direction) as GameEvent[];
      if (!events.length) return;
      playEvents(events);
      setVersion((n) => n + 1);
      checkOutcome();
    },
    [challenge, checkOutcome, game, pendingLoss, playEvents, result]
  );

  const swipe = useBoardSwipe(commit, Boolean(game) && !result);

  const reset = async () => {
    setRunId(null);
    setGame(null);
    await startRun(null);
  };

  if (isLoading) return <Screen title="Challenge"><ActivityIndicator /></Screen>;
  if (!user?.isPro) {
    return (
      <Screen title="Challenge" subtitle="Challenge play is a Pro feature.">
        <Link href="/(app)/pro" asChild>
          <Button>Upgrade to Pro</Button>
        </Link>
      </Screen>
    );
  }
  if (!challenge) return <Screen title="Challenge"><Text style={{ color: theme.textLight }}>Challenge not found.</Text></Screen>;

  const winTile = isRecovery ? Number(challenge.params.winTile ?? 4096) : null;

  return (
    <Screen scroll={false}>
      <GestureDetector gesture={swipe}>
        <View style={styles.play} key={version}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: theme.textLight }]}>Daily Challenge</Text>
              <Text style={[styles.title, { color: theme.primary }]}>{challenge.title}</Text>
              <Text style={{ color: theme.textLight }}>{formatChallengeObjective(challenge)}</Text>
            </View>
            <View style={styles.stats}>
              {isRecovery ? (
                <>
                  <View style={[styles.stat, { backgroundColor: theme.boardBackground }]}>
                    <Text style={[styles.statLabel, { color: boardInk }]}>Moves</Text>
                    <Text style={[styles.statValue, { color: boardInk }]}>{game?.moveCount ?? 0}</Text>
                  </View>
                  {winTile ? (
                    <View style={[styles.stat, { backgroundColor: theme.boardBackground }]}>
                      <Text style={[styles.statLabel, { color: boardInk }]}>Goal</Text>
                      <Text style={[styles.statValue, { color: boardInk }]}>{winTile}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <View style={[styles.stat, { backgroundColor: theme.boardBackground }]}>
                    <Text style={[styles.statLabel, { color: boardInk }]}>Score</Text>
                    <Text style={[styles.statValue, { color: boardInk }]}>{game?.score.toLocaleString() ?? "—"}</Text>
                  </View>
                  {isTime ? (
                    <View style={[styles.stat, { backgroundColor: theme.boardBackground }]}>
                      <Text style={[styles.statLabel, { color: remainingMs <= 10000 ? urgentInk : boardInk }]}>Time</Text>
                      <Text style={[styles.statValue, { color: remainingMs <= 10000 ? urgentInk : boardInk }]}>
                        {formatCountdown(remainingMs)}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {game ? <Board board={game.board} tiles={tiles} /> : <ActivityIndicator />}

          {pendingLoss ? (
            <Text style={{ color: urgentInk, textAlign: "center", fontWeight: "700" }}>
              {game?.gameOver ? "No moves left…" : isTime ? "Time's up…" : "Challenge over…"}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              variant="secondary"
              disabled={Boolean(result) || pendingLoss}
              onPress={() => void reset()}
            >
              Reset
            </Button>
            <Button variant="outline" onPress={() => router.replace(`/(app)/challenge/${challengeId}`)}>
              Abandon & back
            </Button>
          </View>
        </View>
      </GestureDetector>

      <GameOverlay
        open={Boolean(result)}
        title={result === "won" ? "Challenge Cleared!" : "Challenge Failed"}
        subtitle={
          result === "won"
            ? `Nice work — ${formatChallengeObjective(challenge).toLowerCase()}.`
            : isTime
              ? "Time's up (or game over) before reaching the target score."
              : "Game over before the objective was met."
        }
        stats={[
          isRecovery
            ? { label: "Moves", value: (game?.moveCount ?? 0).toLocaleString() }
            : isTime
              ? { label: "Time", value: formatChallengeElapsedMs(finishedElapsedMs) }
              : { label: "Score", value: (game?.score ?? 0).toLocaleString() },
          { label: isRecovery ? "Score" : "Moves", value: isRecovery ? (game?.score ?? 0).toLocaleString() : (game?.moveCount ?? 0).toLocaleString() },
          { label: isTime ? "Score" : "Time", value: isTime ? (game?.score ?? 0).toLocaleString() : formatChallengeElapsedMs(finishedElapsedMs) }
        ]}
      >
        <Button onPress={() => void reset()}>Retry</Button>
        <Button variant="secondary" onPress={() => router.replace("/(app)/(tabs)/challenges")}>
          Calendar
        </Button>
      </GameOverlay>
    </Screen>
  );
}

const styles = StyleSheet.create({
  play: { flex: 1, gap: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  kicker: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "900" },
  stats: { gap: 8 },
  stat: { minWidth: 72, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  statValue: { fontSize: 16, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10 }
});
