import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, PanResponder, StyleSheet, Text, View } from "react-native";
import { getCurrentGame, saveGame } from "@/api/game";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { DIRECTIONS, LOCAL_STORAGE_BEST_SCORE, LOCAL_STORAGE_CURRENT_GAME } from "@/game/constants";
import { Game } from "@/game/Game";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";

export default function GameScreen() {
  const token = useSessionStore((s) => s.token); const theme = useThemeStore((s) => s.theme); const [game, setGame] = useState(() => new Game()); const [best, setBest] = useState(0); const [, force] = useState(0);
  useEffect(() => { let cancelled = false; (async () => { try { const saved = await AsyncStorage.getItem(LOCAL_STORAGE_CURRENT_GAME); const bestSaved = await AsyncStorage.getItem(LOCAL_STORAGE_BEST_SCORE); if (bestSaved) setBest(Number(bestSaved)); if (token) { const current = await getCurrentGame().catch(() => null); if (!cancelled && current?.game) { setGame(new Game({ initialState: current.game })); return; } } if (!cancelled && saved) setGame(new Game({ initialState: JSON.parse(saved) })); } catch {} })(); return () => { cancelled = true; }; }, [token]);
  useEffect(() => { const json = game.json(); void AsyncStorage.setItem(LOCAL_STORAGE_CURRENT_GAME, JSON.stringify(json)); if (game.score > best) { setBest(game.score); void AsyncStorage.setItem(LOCAL_STORAGE_BEST_SCORE, String(game.score)); } if (token) { const id = setTimeout(() => void saveGame(json).catch(() => undefined), 450); return () => clearTimeout(id); } }, [game, game.score, game.moveCount, token, best]);
  const commit = useCallback((direction: number) => { const events = game.moveTiles(direction); if (!events.length) return; void Haptics.selectionAsync().catch(() => undefined); force((n) => n + 1); if (game.gameOver) Alert.alert("Game over", `Score: ${game.score.toLocaleString()}`); else if (game.won && !game.canContinue) Alert.alert("4096!", "You reached the goal. Keep playing or start a new game."); }, [game]);
  const responder = useMemo(() => PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 || Math.abs(g.dy) > 12, onPanResponderRelease: (_, g) => { const ax = Math.abs(g.dx), ay = Math.abs(g.dy); if (Math.max(ax, ay) < 32) return; commit(ax > ay ? (g.dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT) : (g.dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP)); } }), [commit]);
  const newGame = () => { setGame(new Game()); force((n) => n + 1); };
  return <Screen title="Classic" scroll={false}><View style={styles.stats}><View><Text style={[styles.label, { color: theme.textLight }]}>Score</Text><Text style={[styles.value, { color: theme.text ?? theme.textLight }]}>{game.score.toLocaleString()}</Text></View><View><Text style={[styles.label, { color: theme.textLight }]}>Best</Text><Text style={[styles.value, { color: theme.text ?? theme.textLight }]}>{best.toLocaleString()}</Text></View></View><View {...responder.panHandlers}><Board board={game.board} /></View><View style={styles.actions}><Button style={{ flex: 1 }} variant="secondary" disabled={!game.canUndo} onPress={() => { if (game.undo()) force((n) => n + 1); }}>Undo</Button><Button style={{ flex: 1 }} onPress={newGame}>New game</Button></View><Text style={{ color: theme.textLight, textAlign: "center" }}>{token ? "Autosaving to Play4096." : "Guest mode: saved offline on this device."}</Text></Screen>;
}
const styles = StyleSheet.create({ stats: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, label: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" }, value: { fontSize: 30, fontWeight: "900" }, actions: { flexDirection: "row", gap: 12 } });
