import type { LeaderboardEntry } from "@/types";
import { get } from "./client";

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  userBestScore?: number | null;
  period: string;
  rangeLabel?: string;
  isCurrent?: boolean;
};

export const getAllTimeLeaderboard = (limit = 25) => get<LeaderboardResponse>(`/leaderboard?limit=${limit}`);
export const getPeriodLeaderboard = (period: string, limit = 25) =>
  get<LeaderboardResponse>(`/leaderboard/period?period=${encodeURIComponent(period)}&limit=${limit}`);
