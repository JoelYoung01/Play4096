export interface GameEvent {
  start?: { x: number, y: number };
  end?: { x: number, y: number };
  merged?: number;
  gameLost?: boolean;
  gameWon?: boolean;
}