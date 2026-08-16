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
