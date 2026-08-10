import type { GameState } from "@/types";
import { get, post } from "./client";

export type CurrentGameResponse = { game: GameState | null; checkpoint?: unknown; bestWin?: unknown };
export type SaveGameResponse = { success: boolean; id: string };
export type HistoryResponse = { games: GameState[] };
export type GameDetailResponse = { game: GameState; replayable: boolean; replayUnavailableReason?: string | null };

export const getCurrentGame = () => get<CurrentGameResponse>("/game/current");
export const saveGame = (game: GameState) => post<SaveGameResponse>("/game/save", game);
export const getHistory = (params = "limit=50") => get<HistoryResponse>(`/game/history?${params}`);
export const getHistoryGame = (id: string) => get<GameDetailResponse>(`/game/history/${encodeURIComponent(id)}`);
