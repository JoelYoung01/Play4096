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
  type?: number;
  start?: { x: number, y: number };
  end?: { x: number, y: number };
  value?: number;
  newTileValue?: number;
  merged?: boolean;
  gameLost?: boolean;
  gameWon?: boolean;
  snapshot?: number[][];
}

export interface VisualTile {
  id: string;
  value: number;
  logicalPos: { x: number, y: number };
  currentPos: { x: number, y: number };
  targetPos: { x: number, y: number };
  alpha: number;
  scale: number;
  spawning: boolean;
  merging: boolean;
  mergePop: boolean;
  mergePopProgress: number;
  mergeSurvivorId: string | null;
  pendingMergeValue: number | null;
  hidden: boolean;
}

export interface GameOptions {
  id?: string;
  boardSize?: number;
  startingTiles?: number;
  initialState?: GameState | null;
  seed?: number;
}

export interface GameUndoSnapshot {
  board: number[][];
  score: number;
  gameOver: boolean;
  won: boolean;
  canContinue: boolean;
  rngState: number;
  moveCount: number;
}

export interface GameState {
  id?: string;
  board: number[][];
  score: number;
  seed?: number;
  rngState?: number;
  moveCount?: number;
  undoCooldownRemaining?: number;
  /** Recorded move directions; null when replay was invalidated (e.g. cheat) */
  moves?: number[] | null;
}

export interface GameSaveData {
  id?: string;
  playerId: string;
  score: number;
  board: number[][];
  won: boolean;
  complete: boolean;
  seed?: number;
  rngState?: number;
  moveCount?: number;
  undoCooldownRemaining?: number;
  /** Recorded move directions; null when replay was invalidated (e.g. cheat) */
  moves?: number[] | null;
}

export interface GameHistoryEntry {
  id: string;
  score: number;
  won: boolean;
  complete: boolean;
  moveCount: number;
  createdOn: Date;
  updatedOn: Date;
  completedOn: Date | null;
  hasReplay: boolean;
}

export type GameHistorySort = "date" | "score" | "moves";
export type GameHistoryFilter = "all" | "won" | "lost";