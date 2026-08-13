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
