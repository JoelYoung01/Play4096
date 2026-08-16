import type { BestWinStats, CheckpointInfo, CheckpointRestoreState, GameState } from "@/types";
import { del, get, post } from "./client";

export type CurrentGameResponse = { game: GameState | null; checkpoint?: CheckpointInfo | null; bestWin?: BestWinStats | null };
export type SaveGameResponse = { success: boolean; id: string };
export type HistoryResponse = { games: GameState[] };
export type GameDetailResponse = { game: GameState; replayable: boolean; replayUnavailableReason?: string | null };
export type CheckpointSaveResponse = { success: boolean; checkpoint: CheckpointInfo };
export type CheckpointRestoreResponse = { success: boolean; game: CheckpointRestoreState };

export const getCurrentGame = () => get<CurrentGameResponse>("/game/current");
export const saveGame = (game: GameState) => post<SaveGameResponse>("/game/save", game);
export const getHistory = (params = "limit=50") => get<HistoryResponse>(`/game/history?${params}`);
export const getHistoryGame = (id: string) => get<GameDetailResponse>(`/game/history/${encodeURIComponent(id)}`);
export const saveCheckpoint = (body: {
  gameId: string;
  board: number[][];
  score: number;
  seed?: number;
  rngState?: number;
  moveCount: number;
  undoCooldownRemaining?: number;
  won?: boolean;
  moves?: number[] | null;
}) => post<CheckpointSaveResponse>("/game/checkpoint", body);
export const restoreCheckpoint = (gameId: string) => post<CheckpointRestoreResponse>("/game/checkpoint/restore", { gameId });
export const clearCheckpoint = (checkpointId: string) => del<{ success: boolean }>("/game/checkpoint", { checkpointId });
