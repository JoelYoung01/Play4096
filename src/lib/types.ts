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
  boardSize?: number;
  startingTiles?: number;
  initialState?: number[][] | null;
  bestScore?: number;
}