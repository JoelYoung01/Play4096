export const APP_SLUG = "play-4096";
export const SUPPORT_EMAIL = "support@play-4096.com";

export const TWO_TO_FOUR_RATIO = 0.9;
export const DEFAULT_BOARD_SIZE = 4;
export const DEFAULT_STARTING_TILES = 2;
/** Moves required after an undo before undo can be used again */
export const UNDO_COOLDOWN_MOVES = 10;
export const SPAWN_START_SCALE = 0.5;
export const DEFAULT_LUMINANCE_THRESHOLD = 0.7;
export const TILE_SPAWN_DURATION = 100;
export const TILE_MERGE_DURATION = 100;
export const TILE_MOVE_DURATION_MS = 12;
export const LOCAL_STORAGE_CURRENT_GAME = "play-4096.currentGame";
export const LOCAL_STORAGE_BEST_SCORE = "play-4096.bestScore";
export const LOCAL_STORAGE_THEME = "play-4096.theme";
export const THEME_COOKIE_NAME = "play-4096.theme";
export const DEFAULT_WIN_TILE = 4096;

export const USER_STATUS = {
	NEW: 10,
	ACTIVE: 20,
	INACTIVE: 30,
	DELETED: 40,
};

export const USER_LEVELS = {
	FREE: 10,
	PRO: 20,
};

export const EVENT_TYPES = {
	MOVE: 10,
	SPAWN: 20,
	SNAPSHOT: 30,
};

/** Slide directions recorded in `game.moves` for replay */
export const DIRECTIONS = {
	LEFT: 10,
	RIGHT: 20,
	UP: 30,
	DOWN: 40,
};

/**
 * Board transforms recorded in `game.moves` alongside slide directions.
 * Values stay outside the DIRECTIONS range so older replay clients can detect unknowns.
 */
export const BOARD_TRANSFORMS = {
	ROTATE_CW: 50,
	ROTATE_CCW: 60,
	MIRROR_H: 70,
	MIRROR_V: 80,
};

/** @type {ReadonlySet<number>} */
export const SLIDE_DIRECTION_VALUES = new Set(Object.values(DIRECTIONS));

/** @type {ReadonlySet<number>} */
export const BOARD_TRANSFORM_VALUES = new Set(Object.values(BOARD_TRANSFORMS));
