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
  /** When true with snapshot, animator rebuilds tiles immediately (board transforms). */
  resync?: boolean;
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
  /** Tile value that counts as a win (default 4096). Used by recovery challenges. */
  winTile?: number;
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
  /** Recorded slide directions and board transforms; null when recording was invalidated */
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
  /** Recorded slide directions and board transforms; null when recording was invalidated */
  moves?: number[] | null;
}

/** Derived from `complete` — not a separate DB column */
export type GameHistoryStatus = "active" | "finished";

export interface GameHistoryEntry {
  id: string;
  score: number;
  won: boolean;
  complete: boolean;
  /** `active` when incomplete; `finished` when complete (including abandoned) */
  status: GameHistoryStatus;
  moveCount: number;
  createdOn: Date;
  updatedOn: Date;
  completedOn: Date | null;
  hasReplay: boolean;
  /** Set when hasReplay is false; explains why move-by-move replay isn't available */
  replayUnavailableReason: string | null;
}

export type GameHistorySort = "date" | "score" | "moves";
export type GameHistoryFilter = "all" | "active" | "won" | "lost";


/** Snapshot payload used when setting a checkpoint */
export interface CheckpointSaveData {
  gameId: string;
  board: number[][];
  score: number;
  seed?: number;
  rngState?: number;
  moveCount?: number;
  undoCooldownRemaining?: number;
  won?: boolean;
  /** Move directions at checkpoint time (null when recording was invalidated) */
  moves?: number[] | null;
}

/** Active checkpoint metadata returned to the client */
export interface CheckpointInfo {
  id: string;
  gameId: string;
  createdOn: number;
  score: number;
  moveCount: number;
}

/** Full checkpoint state used when restoring into the current game */
export interface CheckpointRestoreState {
  id: string;
  board: number[][];
  score: number;
  seed?: number;
  rngState?: number;
  moveCount: number;
  undoCooldownRemaining: number;
  won: boolean;
  complete: boolean;
  /** Restored move history when the checkpoint stored it; null for legacy checkpoints */
  moves?: number[] | null;
}
