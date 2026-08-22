export type User = {
  id: string;
  username: string;
  email?: string | null;
  emailVerified?: boolean;
  level?: number;
  isPro?: boolean;
  displayName?: string | null;
  bestScore?: number | null;
  themeId?: string | null;
  [key: string]: unknown;
};

export type TokenPayload = {
  access_token: string;
  expires_at?: string | null;
  refresh_token?: string | null;
  refresh_expires_at?: string | null;
  user: User;
};

export type GameState = {
  id?: string;
  board: number[][];
  score: number;
  complete?: boolean;
  won?: boolean;
  gameOver?: boolean;
  seed?: number;
  rngState?: number;
  moveCount?: number;
  undoCooldownRemaining?: number;
  moves?: number[] | null;
  createdOn?: number | null;
  [key: string]: unknown;
};

export type Theme = {
  id: string;
  name: string;
  pro?: boolean;
  locked?: boolean;
  primary: string;
  secondary: string;
  secondaryForeground?: string;
  background: string;
  boardBackground: string;
  emptyTile: string;
  textLight: string;
  textDark: string;
  text?: string;
  unknownTile: string;
  border?: string;
  destructive?: string;
  shadows?: boolean;
  textScale: number;
  luminanceThreshold: number;
  movementSpeed: number;
  challengeWon?: string;
  challengeLost?: string;
  challengeToday?: string;
  tiles: Record<number, string>;
};

export type LeaderboardEntry = {
  rank?: number;
  username?: string;
  displayName?: string | null;
  score?: number;
  bestScore?: number;
  value?: number;
  [key: string]: unknown;
};

export type ChallengeDefinition = {
  id: string;
  type: "time" | "recovery" | string;
  title: string;
  description: string;
  difficulty: string;
  params: Record<string, unknown>;
};

export type CheckpointInfo = {
  id: string;
  gameId: string;
  createdOn: number;
  score: number;
  moveCount: number;
  maxTile: number;
};

export type CheckpointRestoreState = GameState & {
  id: string;
  board: number[][];
  score: number;
  moveCount: number;
  undoCooldownRemaining: number;
  won: boolean;
  complete?: boolean;
};

export type VisualTile = {
  id: string;
  value: number;
  logicalPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  alpha: number;
  scale: number;
  spawning: boolean;
  merging: boolean;
  mergePop: boolean;
  mergePopProgress: number;
  mergeSurvivorId: string | null;
  pendingMergeValue: number | null;
  hidden: boolean;
};

export type GameEvent = {
  type?: number;
  start?: { x: number; y: number } | number;
  end?: { x: number; y: number } | number;
  value?: number;
  merged?: boolean;
  newTileValue?: number;
  snapshot?: number[][];
  resync?: boolean;
  gameWon?: boolean;
  gameLost?: boolean;
  [key: string]: unknown;
};

export type ChallengeUserStats = {
  attempts?: number;
  wins?: number;
  bestStatus?: string | null;
  bestMoveCount?: number | null;
  bestElapsedMs?: number | null;
};

export type BestWinStats = {
  moves?: number | null;
  timeMs?: number | null;
};

export type PlayStats = {
  totalGames: number;
  completedGames: number;
  activeGames: number;
  wins: number;
  losses: number;
  winRate: number | null;
  bestScore: number | null;
  averageScore: number | null;
  highestTile: number;
  leastMovesToWin: number | null;
  fastestWinMs: number | null;
  totalMoves: number;
  averageMovesPerWin: number | null;
  longestWinStreak: number;
  currentWinStreak: number;
  challengeAttempts: number;
  challengeWins: number;
  challengeLosses: number;
  challengeWinRate: number | null;
  averageDailyChallengeRank: number | null;
  rankedChallengeClears: number;
  bestChallengeElapsedMs: number | null;
  bestChallengeMoveCount: number | null;
};

export type HistoryStatus = "active" | "finished";
export type HistorySort = "date" | "score" | "moves";
export type HistoryFilter = "all" | "active" | "won" | "lost";

export type HistoryEntry = {
  id: string;
  score: number;
  won: boolean;
  complete: boolean;
  status: HistoryStatus;
  moveCount: number;
  createdOn?: string | number | Date | null;
  updatedOn?: string | number | Date | null;
  completedOn?: string | number | Date | null;
  hasReplay: boolean;
  replayUnavailableReason?: string | null;
};
