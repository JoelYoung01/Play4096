export interface LocalsUser {
  id: string;
  username: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  emailVerified: boolean;
  admin: boolean;
  level: number;
  displayName: string | null;
  avatarUrl: string | null;
  bestScore: number | null;
}

export interface GameEvent {
  start?: { x: number, y: number };
  end?: { x: number, y: number };
  merged?: number;
  gameLost?: boolean;
  gameWon?: boolean;
  snapshot?: number[][];
}

export interface TileAnimation {
  moving: boolean;
  spawning: boolean;
  merging: boolean;

  alpha: number;
  scale: number;
  value: number;
  startPos: { x: number, y: number };
  currentPos: { x: number, y: number };
  endPos: { x: number, y: number };
  merged: boolean;
  duration: number;
  startTimestamp: number;
  progress: number;
}

export interface GameOptions {
  id?: string;
  boardSize?: number;
  startingTiles?: number;
  initialState?: GameState | null;
}

export interface GameState {
  id?: string;
  board: number[][];
  score: number;
}

export interface GameSaveData {
  id?: string;
  playerId: string;
  score: number;
  board: number[][];
  won: boolean;
  complete: boolean;
}