import type { ChallengeDefinition, ChallengeUserStats, LeaderboardEntry } from "@/types";
import { get, post } from "./client";

export type ChallengesResponse = {
  today: string;
  todayChallenge: ChallengeDefinition;
  isPro: boolean;
  month: string;
  dayStatuses: Record<string, string> | null;
  canPlayPast: boolean;
};
export type ChallengeResponse = {
  challenge: ChallengeDefinition;
  date?: string | null;
  isPast?: boolean;
  locked?: boolean;
  isPro?: boolean;
  userStats?: ChallengeUserStats | null;
  overview?: string;
  isToday?: boolean;
};
export type ChallengeStartResponse = { runId: string; challenge: ChallengeDefinition };
export type ChallengeLeaderboardResponse = {
  challenge: ChallengeDefinition;
  entries: LeaderboardEntry[];
  entryCount: number;
  userRank?: unknown;
};

export const getChallenges = (month?: string) => get<ChallengesResponse>(`/challenges${month ? `?month=${month}` : ""}`);
export const getChallenge = (id: string) => get<ChallengeResponse>(`/challenges/${encodeURIComponent(id)}`);
export const startChallenge = (id: string) => post<ChallengeStartResponse>(`/challenges/${encodeURIComponent(id)}/start`);
export const completeChallenge = (id: string, body: { runId: string; status: "won" | "lost"; score: number; metrics?: object }) =>
  post<{ run: unknown }>(`/challenges/${encodeURIComponent(id)}/complete`, body);
export const getChallengeLeaderboard = (id: string) => get<ChallengeLeaderboardResponse>(`/challenges/${encodeURIComponent(id)}/leaderboard`);
