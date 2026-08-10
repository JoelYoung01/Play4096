export const TWO_TO_FOUR_RATIO = 0.9;
export const DEFAULT_BOARD_SIZE = 4;
export const DEFAULT_STARTING_TILES = 2;
export const UNDO_COOLDOWN_MOVES = 10;
export const DEFAULT_WIN_TILE = 4096;
export const LOCAL_STORAGE_CURRENT_GAME = "play-4096.currentGame";
export const LOCAL_STORAGE_BEST_SCORE = "play-4096.bestScore";

export const EVENT_TYPES = {
  MOVE: 10,
  SPAWN: 20,
  SNAPSHOT: 30
} as const;

export const DIRECTIONS = {
  LEFT: 10,
  RIGHT: 20,
  UP: 30,
  DOWN: 40
} as const;

export const BOARD_TRANSFORMS = {
  ROTATE_CW: 50,
  ROTATE_CCW: 60,
  MIRROR_H: 70,
  MIRROR_V: 80
} as const;

export const SLIDE_DIRECTION_VALUES = new Set<number>(Object.values(DIRECTIONS));
export const BOARD_TRANSFORM_VALUES = new Set<number>(Object.values(BOARD_TRANSFORMS));
