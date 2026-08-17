import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { getCurrentGame, restoreCheckpoint, saveCheckpoint, saveGame } from "@/api/game";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GameControls } from "@/components/GameControls";
import { GameOverlay } from "@/components/GameOverlay";
import { Screen } from "@/components/Screen";
import { LOCAL_STORAGE_BEST_SCORE, LOCAL_STORAGE_BEST_WIN, LOCAL_STORAGE_CURRENT_GAME } from "@/game/constants";
import { Game } from "@/game/Game";
import { getInkColor } from "@/theme/themes";
import { useAnimatedBoard } from "@/hooks/useAnimatedBoard";
import { useBoardSwipe } from "@/hooks/useBoardSwipe";
import { formatWinDuration } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import type { CheckpointInfo, GameEvent, GameState } from "@/types";

function largestMergedTile(events: GameEvent[]) {
  let largest = 0;
  for (const event of events) {
    if (event.merged && typeof event.value === "number") largest = Math.max(largest, event.value * 2);
  }
  return largest;
}

export default function GameScreen() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const [game, setGame] = useState(() => new Game());
  const [best, setBest] = useState(0);
  const [bestWinMoves, setBestWinMoves] = useState<number | null>(null);
  const [bestWinTimeMs, setBestWinTimeMs] = useState<number | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointInfo | null>(null);
  const [tick, setTick] = useState(0);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [overlayElapsedMs, setOverlayElapsedMs] = useState<number | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const { tiles, idle, playEvents, syncBoard } = useAnimatedBoard(game);
  const pendingCheckpoint = useRef<{ game: Game; snapshot: GameState; tile: number } | null>(null);
  const checkpointInFlight = useRef(false);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCAL_STORAGE_CURRENT_GAME);
        const bestSaved = await AsyncStorage.getItem(LOCAL_STORAGE_BEST_SCORE);
        const bestWinSaved = await AsyncStorage.getItem(LOCAL_STORAGE_BEST_WIN);
        if (bestSaved) setBest(Number(bestSaved));
        if (bestWinSaved) {
          const parsed = JSON.parse(bestWinSaved) as { moves?: number; timeMs?: number };
          if (parsed.moves != null) setBestWinMoves(parsed.moves);
          if (parsed.timeMs != null) setBestWinTimeMs(parsed.timeMs);
        }
        if (token) {
          const current = await getCurrentGame().catch(() => null);
          if (!cancelled && current?.game) {
            const loaded = new Game({ initialState: current.game });
            setGame(loaded);
            setKeepPlaying(Boolean(loaded.won));
            setCheckpoint(current.checkpoint ?? null);
            return;
          }
        }
        if (!cancelled && saved) setGame(new Game({ initialState: JSON.parse(saved) }));
      } catch {
        /* keep a fresh board */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const json = game.json();
    void AsyncStorage.setItem(LOCAL_STORAGE_CURRENT_GAME, JSON.stringify(json));
    if (token) {
      const id = setTimeout(() => {
        void saveGame(json)
          .then((result) => {
            if (result.id) game.id = result.id;
          })
          .catch(() => undefined);
      }, 450);
      return () => clearTimeout(id);
    }
  }, [game, game.score, game.moveCount, token, tick]);

  const showGameOver = idle && game.gameOver;
  const showWin = idle && game.won && !keepPlaying;

  const flushCheckpoint = useCallback(async () => {
    if (checkpointInFlight.current || !user?.isPro || !token) return;
    checkpointInFlight.current = true;
    try {
      while (pendingCheckpoint.current) {
        const next = pendingCheckpoint.current;
        pendingCheckpoint.current = null;
        if (next.game !== game) continue;
        let gameId = next.game.id;
        if (!gameId) {
          const saved = await saveGame(next.snapshot).catch(() => null);
          gameId = saved?.id ?? next.game.id;
          if (gameId) next.game.id = gameId;
        }
        if (!gameId) continue;
        const result = await saveCheckpoint({
          gameId,
          board: next.snapshot.board,
          score: next.snapshot.score,
          seed: next.snapshot.seed,
          rngState: next.snapshot.rngState,
          moveCount: next.snapshot.moveCount ?? 0,
          undoCooldownRemaining: next.snapshot.undoCooldownRemaining,
          won: next.snapshot.won,
          moves: next.snapshot.moves
        }).catch(() => null);
        if (result?.checkpoint && next.game === game) setCheckpoint(result.checkpoint);
      }
    } finally {
      checkpointInFlight.current = false;
    }
  }, [game, token, user?.isPro]);

  const commit = useCallback(
    (direction: number) => {
      if (game.gameOver) return;
      const maxTileBefore = game.maxTile;
      const events = game.moveTiles(direction) as GameEvent[];
      if (!events.length) return;
      playEvents(events);
      void Haptics.selectionAsync().catch(() => undefined);
      if (game.score > best) {
        setBest(game.score);
        void AsyncStorage.setItem(LOCAL_STORAGE_BEST_SCORE, String(game.score));
      }
      const createdTile = largestMergedTile(events);
      if (user?.isPro && !game.gameOver && createdTile > 0 && createdTile >= maxTileBefore) {
        pendingCheckpoint.current = { game, snapshot: game.json(), tile: createdTile };
        void flushCheckpoint();
      }
      if ((game.gameOver || (game.won && !keepPlaying)) && overlayElapsedMs == null && typeof game.createdOn === "number") {
        setOverlayElapsedMs(Math.max(0, Date.now() - game.createdOn));
      }
      if (game.won && !keepPlaying) {
        const moves = game.moveCount;
        const timeMs = typeof game.createdOn === "number" ? Math.max(0, Date.now() - game.createdOn) : null;
        const nextMoves = bestWinMoves == null || moves < bestWinMoves ? moves : bestWinMoves;
        const nextTime = timeMs != null && (bestWinTimeMs == null || timeMs < bestWinTimeMs) ? timeMs : bestWinTimeMs;
        setBestWinMoves(nextMoves);
        setBestWinTimeMs(nextTime);
        void AsyncStorage.setItem(LOCAL_STORAGE_BEST_WIN, JSON.stringify({ moves: nextMoves, timeMs: nextTime }));
      }
      refresh();
    },
    [best, bestWinMoves, bestWinTimeMs, flushCheckpoint, game, keepPlaying, overlayElapsedMs, playEvents, refresh, user?.isPro]
  );

  const swipe = useBoardSwipe(commit);

  const startNewGame = useCallback(async () => {
    if (token && game.moveCount > 0) {
      await saveGame({ ...game.json(), complete: true }).catch(() => undefined);
    }
    pendingCheckpoint.current = null;
    setCheckpoint(null);
    setKeepPlaying(false);
    setOverlayElapsedMs(null);
    setGame(new Game());
  }, [game, token]);

  const requestNewGame = () => {
    if (game.moveCount === 0 || game.gameOver) {
      void startNewGame();
      return;
    }
    setConfirmNew(true);
  };

  const handleUndo = () => {
    if (!game.canUndo) return;
    if (game.undo()) {
      syncBoard();
      refresh();
    }
  };

  const applyTransform = (fn: () => GameEvent[]) => {
    const events = fn();
    if (events.length) {
      playEvents(events);
      refresh();
    } else {
      syncBoard();
      refresh();
    }
  };

  const handleRestore = async () => {
    if (!game.id || !user?.isPro || restoreBusy) return;
    setRestoreBusy(true);
    try {
      const result = await restoreCheckpoint(game.id);
      if (result.game) {
        const next = new Game({ id: result.game.id, initialState: result.game });
        setGame(next);
        setCheckpoint(null);
        setKeepPlaying(false);
        setOverlayElapsedMs(null);
      }
    } finally {
      setRestoreBusy(false);
    }
  };

  const continueAfterWin = () => {
    setKeepPlaying(true);
  };

  const boardInk = getInkColor(theme.boardBackground, theme);
  const checkpointMovesBack = checkpoint ? Math.max(0, game.moveCount - checkpoint.moveCount) : 0;

  return (
    <Screen scroll={false}>
      <GestureDetector gesture={swipe}>
        <View style={styles.play}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.logo, { color: theme.primary }]}>4096</Text>
              <Text style={[styles.tag, { color: theme.textLight }]}>Join the tiles, get to 4096!</Text>
            </View>
            <View style={styles.scores}>
              <View style={[styles.scoreBox, { backgroundColor: theme.boardBackground }]}>
                <Text style={[styles.scoreLabel, { color: boardInk }]}>SCORE</Text>
                <Text style={[styles.scoreValue, { color: boardInk }]}>{game.score.toLocaleString()}</Text>
              </View>
              <View style={[styles.scoreBox, { backgroundColor: theme.boardBackground }]}>
                <Text style={[styles.scoreLabel, { color: boardInk }]}>BEST</Text>
                <Text style={[styles.scoreValue, { color: boardInk }]}>{best.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <GameControls
            canUndo={game.canUndo}
            undoCooldown={game.undoCooldownRemaining}
            isPro={Boolean(user?.isPro)}
            isLoggedIn={Boolean(user)}
            hasCheckpoint={Boolean(checkpoint)}
            checkpointTile={checkpoint?.maxTile}
            restoreBusy={restoreBusy}
            onNewGame={requestNewGame}
            onUndo={handleUndo}
            onRotateCw={() => applyTransform(() => game.rotateBoard(1) as GameEvent[])}
            onRotateCcw={() => applyTransform(() => game.rotateBoard(3) as GameEvent[])}
            onMirrorH={() => applyTransform(() => game.mirrorBoardHorizontally() as GameEvent[])}
            onMirrorV={() => applyTransform(() => game.mirrorBoardVertically() as GameEvent[])}
            onRestoreCheckpoint={() => setConfirmRestore(true)}
          />

          <Board board={game.board} tiles={tiles} />

          <Text style={[styles.help, { color: theme.textLight }]}>
            <Text style={styles.helpStrong}>How to play:</Text> Swipe to move tiles. When two tiles with the same number
            touch, they merge into one!
          </Text>
        </View>
      </GestureDetector>

      <ConfirmDialog
        open={confirmNew}
        title="Start a new game?"
        description={`This ends your current run at ${game.score.toLocaleString()} points and starts a fresh board.`}
        confirmLabel="New Game"
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          setConfirmNew(false);
          void startNewGame();
        }}
      />

      <ConfirmDialog
        open={confirmRestore}
        title={checkpoint?.maxTile ? `Go back to your ${checkpoint.maxTile} tile?` : "Go back to your biggest tile?"}
        description={
          checkpointMovesBack === 0
            ? "This restores your board to right after the move that made your biggest tile. Each checkpoint can only be used once."
            : `This goes back ${checkpointMovesBack.toLocaleString()} move${checkpointMovesBack === 1 ? "" : "s"}, to right after the move that made your biggest tile. Each checkpoint can only be used once.`
        }
        confirmLabel="Go Back"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          setConfirmRestore(false);
          void handleRestore();
        }}
      />

      <GameOverlay
        open={showGameOver}
        title="Game Over!"
        stats={[
          { label: "Score", value: game.score.toLocaleString(), newBest: game.score > 0 && game.score >= best },
          { label: "Moves", value: game.moveCount.toLocaleString() },
          { label: "Time", value: formatWinDuration(overlayElapsedMs) }
        ]}
      >
        {game.canUndo ? <Button onPress={handleUndo}>Undo Last Move</Button> : null}
        {user?.isPro && checkpoint ? (
          <Button variant="secondary" onPress={() => setConfirmRestore(true)}>
            {checkpoint.maxTile ? `Back to Your ${checkpoint.maxTile}` : "Back to Your Biggest Tile"}
          </Button>
        ) : null}
        <Button variant="secondary" onPress={requestNewGame}>
          Try Again
        </Button>
      </GameOverlay>

      <GameOverlay
        open={showWin}
        title="You Won!"
        stats={[
          { label: "Score", value: game.score.toLocaleString(), newBest: game.score >= best },
          { label: "Moves", value: game.moveCount.toLocaleString(), newBest: bestWinMoves != null && game.moveCount <= bestWinMoves },
          { label: "Time", value: formatWinDuration(overlayElapsedMs), newBest: overlayElapsedMs != null && bestWinTimeMs != null && overlayElapsedMs <= bestWinTimeMs }
        ]}
      >
        <Button onPress={continueAfterWin}>Keep Playing</Button>
        <Button variant="secondary" onPress={requestNewGame}>
          New Game
        </Button>
      </GameOverlay>
    </Screen>
  );
}

const styles = StyleSheet.create({
  play: { flex: 1, gap: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  titleBlock: { flex: 1 },
  logo: { fontSize: 48, fontWeight: "900", letterSpacing: -1, lineHeight: 50 },
  tag: { fontSize: 12 },
  scores: { flex: 1, flexDirection: "row", gap: 8 },
  scoreBox: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  scoreLabel: { fontSize: 12, fontWeight: "800" },
  scoreValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  help: { textAlign: "center", fontSize: 13, lineHeight: 18, marginTop: 8 },
  helpStrong: { fontWeight: "800" }
});
