import { browser } from "$app/environment";
import { defaultTheme } from "./assets/themes";
import {
	DEFAULT_BOARD_SIZE,
	DEFAULT_STARTING_TILES,
	DEFAULT_WIN_TILE,
	DIRECTIONS,
	BOARD_TRANSFORMS,
	BOARD_TRANSFORM_VALUES,
	SLIDE_DIRECTION_VALUES,
	EVENT_TYPES,
	TWO_TO_FOUR_RATIO,
	UNDO_COOLDOWN_MOVES,
} from "./constants";
import { createSeededRng, generateSeed } from "./rng.js";

/**
 * Get the background color for a tile using current theme
 * @param {number} value
 * @param {typeof defaultTheme} theme
 * @returns {string}
 */
export function getTileBackground(value, theme = defaultTheme) {
	if (value in theme.tiles) return theme.tiles[value];
	return theme.unknownTile;
}

/**
 * Get the color for a tile using current theme
 * @param {number} value
 * @param {typeof defaultTheme} theme
 * @returns {string}
 */
export function getTileColor(value, theme = defaultTheme) {
	// Get the background color for this tile
	const bg = getTileBackground(value, theme);

	/**
	 * Helper to parse hex color to RGB
	 * @param {string} hex
	 * @returns {{r: number, g: number, b: number}}
	 */
	function hexToRgb(hex) {
		hex = hex.replace(/^#/, "");
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((x) => x + x)
				.join("");
		}
		const num = parseInt(hex, 16);
		return {
			r: (num >> 16) & 255,
			g: (num >> 8) & 255,
			b: num & 255,
		};
	}

	/**
	 * Helper to calculate luminance
	 * @param {{r: number, g: number, b: number}} rgb
	 * @returns {number}
	 */
	function luminance({ r, g, b }) {
		const a = [r, g, b].map(function (v) {
			v /= 255;
			return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
	}

	const rgb = hexToRgb(bg);
	const lum = luminance(rgb);

	// If background is dark, use light text; else, use dark text
	return lum < theme.luminanceThreshold ? theme.textDark : theme.textLight;
}

/**
 * Compare two games
 * @param {import("./types").GameState} game1
 * @param {import("./types").GameState} game2
 * @returns {boolean}
 */
export function isSameGame(game1, game2) {
	if (game1.score !== game2.score) return false;
	if (game1.board.length !== game2.board.length) return false;
	if (game1.board.some((row, i) => row.some((cell, j) => cell !== game2.board[i][j]))) return false;
	return true;
}

/**
 * Resolve the recorded move list when hydrating a Game.
 * Fresh games start with []; legacy mid-game saves without a moves field are not replayable.
 * @param {import("./types").GameState | null | undefined} initialState
 * @returns {number[] | null}
 */
function resolveRecordedMoves(initialState) {
	if (!initialState) return [];
	if (initialState.moves === null) return null;
	if (Array.isArray(initialState.moves)) return [...initialState.moves];
	if ((initialState.moveCount ?? 0) === 0) return [];
	return null;
}

/**
 * Game Class
 *
 * Encapsulates the game state and logic
 */
export class Game {
	/**
	 * Create a new Game
	 * @param {import("./types").GameOptions} options
	 */
	constructor({
		id = undefined,
		boardSize = DEFAULT_BOARD_SIZE,
		startingTiles = DEFAULT_STARTING_TILES,
		initialState = null,
		seed = undefined,
		winTile = DEFAULT_WIN_TILE,
	} = {}) {
		this.id = id ?? initialState?.id;
		this.boardSize = boardSize;
		/** @type {number} */
		this.winTile = winTile;

		/** @type {number[][]} */
		this.board = $state(
			Array(boardSize)
				.fill(null)
				.map(() => Array(boardSize).fill(0))
		);
		this.score = $state(0);
		this.gameOver = $state(false);
		this.won = $state(false);
		this.canContinue = $state(false);
		/** @type {number} */
		this.moveCount = $state(0);
		/** @type {number} Moves remaining before undo is available again */
		this.undoCooldownRemaining = $state(0);
		/** @type {boolean} Reactive flag — true when a one-step undo snapshot exists */
		this.hasUndoSnapshot = $state(false);
		/**
		 * Recorded successful move directions for replay.
		 * null means recording was invalidated (cheat / legacy mid-game).
		 * @type {number[] | null}
		 */
		this.moves = $state(resolveRecordedMoves(initialState));

		const resolvedSeed = seed ?? initialState?.seed ?? generateSeed();
		/** @type {number} */
		this.seed = resolvedSeed;
		this.rng = createSeededRng(resolvedSeed);
		if (initialState?.rngState != null) {
			this.rng.state = initialState.rngState;
		}

		/**
		 * Snapshot of board/score/rng used for a single-step undo.
		 * Not persisted across reloads.
		 * @type {import("./types").GameUndoSnapshot | null}
		 */
		this.#previousState = null;

		this.initialize(initialState, startingTiles);
	}

	/** @type {import("./types").GameUndoSnapshot | null} */
	#previousState;

	/**
	 * Whether the player can undo the last move right now
	 * @returns {boolean}
	 */
	get canUndo() {
		return this.hasUndoSnapshot && this.undoCooldownRemaining === 0;
	}

	/**
	 * Initialize game state
	 * @param {import("./types").GameState?} initialState
	 * @param {number} startingTiles
	 */
	initialize(initialState, startingTiles) {
		// Don't load tiles during SSR
		if (!browser) return;

		// Load initial state if provided
		if (initialState) {
			this.board = initialState.board.map((row) => [...row]);
			this.score = initialState.score;
			this.boardSize = this.board.length;
			this.moveCount = initialState.moveCount ?? 0;
			this.undoCooldownRemaining = initialState.undoCooldownRemaining ?? 0;
			this.checkWin();
			this.checkGameOver();

			if (this.won) {
				this.canContinue = true;
			}
		}

		// Add starting tiles if no initial state is provided
		else {
			for (let i = 0; i < startingTiles; i++) {
				this.addNewTile();
			}
		}
	}

	/**
	 * Undo the last successful move or board transform, if allowed.
	 * After undoing, undo stays disabled until UNDO_COOLDOWN_MOVES new moves.
	 * @returns {boolean} Whether an undo was applied
	 */
	undo() {
		if (!this.canUndo || !this.#previousState) return false;

		const snapshot = this.#previousState;
		this.board = snapshot.board.map((row) => [...row]);
		this.score = snapshot.score;
		this.gameOver = snapshot.gameOver;
		this.won = snapshot.won;
		this.canContinue = snapshot.canContinue;
		this.rng.state = snapshot.rngState;
		this.moveCount = snapshot.moveCount;
		this.#previousState = null;
		this.hasUndoSnapshot = false;
		this.undoCooldownRemaining = UNDO_COOLDOWN_MOVES;
		if (this.moves) {
			this.moves = this.moves.slice(0, -1);
		}

		return true;
	}

	/**
	 * Capture undo state before a successful slide or board transform.
	 * @returns {import("./types").GameUndoSnapshot}
	 */
	#captureUndoSnapshot() {
		return {
			board: this.board.map((row) => [...row]),
			score: this.score,
			gameOver: this.gameOver,
			won: this.won,
			canContinue: this.canContinue,
			rngState: this.rng.state,
			moveCount: this.moveCount,
		};
	}

	/**
	 * Commit a recorded action (slide direction or board transform) into history.
	 * @param {number} action
	 * @param {import("./types").GameUndoSnapshot} undoSnapshot
	 */
	#commitRecordedAction(action, undoSnapshot) {
		this.#previousState = undoSnapshot;
		this.hasUndoSnapshot = true;
		this.moveCount += 1;
		if (this.moves) {
			this.moves = [...this.moves, action];
		}
		if (this.undoCooldownRemaining > 0) {
			this.undoCooldownRemaining -= 1;
		}
	}

	/**
	 * Apply a recorded slide or board-transform action (used by replay).
	 * @param {number} action
	 * @returns {import("./types").GameEvent[]}
	 */
	applyRecordedAction(action) {
		if (SLIDE_DIRECTION_VALUES.has(action)) {
			return this.moveTiles(action);
		}
		if (BOARD_TRANSFORM_VALUES.has(action)) {
			return this.applyBoardTransform(action);
		}
		return [];
	}

	/**
	 * Apply a board transform without spawning tiles, recording it for replay/undo.
	 * @param {number} transform One of {@link BOARD_TRANSFORMS}
	 * @returns {import("./types").GameEvent[]}
	 */
	applyBoardTransform(transform) {
		if (this.gameOver) return [];
		if (!BOARD_TRANSFORM_VALUES.has(transform)) return [];

		const undoSnapshot = this.#captureUndoSnapshot();
		this.#mutateBoardTransform(transform);
		this.#commitRecordedAction(transform, undoSnapshot);

		return [{ resync: true, snapshot: this.board.map((row) => [...row]) }];
	}

	/**
	 * Mutate `this.board` for a single transform action (no recording / undo).
	 * @param {number} transform
	 */
	#mutateBoardTransform(transform) {
		const n = this.boardSize;
		const src = this.board;
		const next = Array(n)
			.fill(null)
			.map(() => Array(n).fill(0));

		if (transform === BOARD_TRANSFORMS.ROTATE_CW) {
			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					next[j][n - 1 - i] = src[i][j];
				}
			}
		} else if (transform === BOARD_TRANSFORMS.ROTATE_CCW) {
			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					next[n - 1 - j][i] = src[i][j];
				}
			}
		} else if (transform === BOARD_TRANSFORMS.MIRROR_H) {
			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					next[i][n - 1 - j] = src[i][j];
				}
			}
		} else if (transform === BOARD_TRANSFORMS.MIRROR_V) {
			for (let i = 0; i < n; i++) {
				for (let j = 0; j < n; j++) {
					next[n - 1 - i][j] = src[i][j];
				}
			}
		} else {
			return;
		}

		this.board = next;
	}

	/**
	 * Check if player has won
	 * @returns {boolean}
	 */
	checkWin() {
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] >= this.winTile) {
					this.won = true;
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Add a new tile (2 or 4) to a seeded-random empty position
	 * @param {number | null} valueInput
	 */
	addNewTile(valueInput = null) {
		const type = EVENT_TYPES.SPAWN;
		const newTileValue = valueInput ?? (this.rng.next() < TWO_TO_FOUR_RATIO ? 2 : 4);

		// Find all empty cells
		const emptyCells = [];
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === 0) {
					emptyCells.push({ row: i, col: j });
				}
			}
		}

		if (emptyCells.length === 0) return null;

		// Pick a seeded-random empty cell and set it to the new tile value
		const randomCell = emptyCells[this.rng.nextInt(emptyCells.length)];
		this.board[randomCell.row][randomCell.col] = newTileValue;

		// Generate the spawn event
		const event = { end: { x: randomCell.col, y: randomCell.row }, newTileValue, type };
		return event;
	}

	/**
	 * Check if the game is over
	 * @returns {boolean}
	 */
	checkGameOver() {
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				// Check for empty cell
				const emptyCell = this.board[i][j] === 0;
				const horizontalMove = j < this.boardSize - 1 && this.board[i][j] === this.board[i][j + 1];
				const verticalMove = i < this.boardSize - 1 && this.board[i][j] === this.board[i + 1][j];

				if (emptyCell || horizontalMove || verticalMove) return false;
			}
		}

		this.gameOver = true;
		return true;
	}

	/**
	 * Check if a line can move
	 * @param {number[]} line
	 * @returns {boolean}
	 */
	canMove(line) {
		for (let i = 0; i < line.length - 1; i++) {
			const isSameAsNextAndNotEmpty = line[i] === line[i + 1] && line[i] !== 0;
			const isEmptyAndNextIsNot = line[i] === 0 && line[i + 1] !== 0;
			const isNotEmptyButNextIs = line[i] !== 0 && line[i + 1] === 0;
			if (isSameAsNextAndNotEmpty || isEmptyAndNextIsNot || isNotEmptyButNextIs) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Move and merge tiles in one direction
	 * @param {number[]} inputLine
	 * @returns {{result: number[], moves: Record<string, any>[]}}
	 */
	collapseLine(inputLine) {
		let lastPlaced = 0;
		let current = 1;
		let line = [...inputLine];
		/**
		 * @type {Record<string, any>[]}
		 */
		let moveQueue = [];

		// For each tile, move it to the 'end'
		while (current < line.length) {
			const type = EVENT_TYPES.MOVE;
			const value = line[current];
			// If the current tile is empty, skip it
			if (value === 0) {
				// do nothing
			}

			// If the last placed tile is empty and this tile isn't, move the current tile to the last placed tile
			else if (line[lastPlaced] === 0) {
				line[lastPlaced] = value;
				line[current] = 0;
				moveQueue.push({ start: current, end: lastPlaced, value, type });
			}

			// If the last placed tile is the same as the current tile, merge them
			else if (line[lastPlaced] === value) {
				line[lastPlaced] *= 2;
				line[current] = 0;
				this.score += line[lastPlaced];
				moveQueue.push({ start: current, end: lastPlaced, merged: true, value, type });
				lastPlaced++;
			}

			// If the last placed is different, move the current tile to the space after the last placed tile
			else if (lastPlaced + 1 !== current) {
				line[lastPlaced + 1] = value;
				line[current] = 0;
				lastPlaced++;
				moveQueue.push({ start: current, end: lastPlaced, value, type });
			}

			// If the last placed is the same as the current, mark current tile as placed.
			else {
				lastPlaced++;
			}

			current++;
		}

		return { result: line, moves: moveQueue };
	}

	/**
	 * Move tiles in a specific direction
	 * @param {number} direction
	 * @returns {import("./types").GameEvent[]}
	 */
	moveTiles(direction) {
		if (this.gameOver) return [];

		/**
		 * @type {import("./types").GameEvent[]}
		 */
		let moveQueue = [];

		// Snapshot before any merges so score/board/rng stay undoable
		const undoSnapshot = {
			board: this.board.map((row) => [...row]),
			score: this.score,
			gameOver: this.gameOver,
			won: this.won,
			canContinue: this.canContinue,
			rngState: this.rng.state,
			moveCount: this.moveCount,
		};

		const newBoard = this.board.map((row) => [...row]);

		if (direction === DIRECTIONS.LEFT) {
			// Move left: tiles slide to the left and merge
			for (let i = 0; i < this.boardSize; i++) {
				const originalRow = [...newBoard[i]];

				// Only process if movement is possible
				if (this.canMove(originalRow)) {
					const { result, moves } = this.collapseLine(originalRow);

					// Only update if the row actually changed
					if (moves.length > 0) {
						newBoard[i] = result;
						moveQueue.push(
							...moves.map((move) => ({
								...move,
								start: { x: move.start ?? 0, y: i },
								end: { x: move.end ?? 0, y: i },
							}))
						);
					}
				}
			}
		} else if (direction === DIRECTIONS.RIGHT) {
			// Move right: tiles slide to the right and merge
			for (let i = 0; i < this.boardSize; i++) {
				const originalRow = [...newBoard[i]].toReversed();

				// Only process if movement is possible
				if (this.canMove(originalRow)) {
					const { result, moves } = this.collapseLine(originalRow);

					// Only update if the row actually changed
					if (moves.length > 0) {
						newBoard[i] = result.toReversed();
						moveQueue.push(
							...moves.map((move) => ({
								...move,
								start: { x: result.length - 1 - (move.start ?? 0), y: i },
								end: { x: result.length - 1 - (move.end ?? 0), y: i },
							}))
						);
					}
				}
			}
		} else if (direction === DIRECTIONS.UP) {
			// Move up: tiles slide up and merge
			for (let j = 0; j < this.boardSize; j++) {
				const col = [];
				for (let i = 0; i < this.boardSize; i++) {
					col.push(newBoard[i][j]);
				}

				// Only process if movement is possible
				if (this.canMove(col)) {
					const { result, moves } = this.collapseLine(col);

					// Only update if the column actually changed
					if (moves.length > 0) {
						// Update the column
						for (let i = 0; i < this.boardSize; i++) {
							newBoard[i][j] = result[i];
						}
						moveQueue.push(
							...moves.map((move) => ({
								...move,
								start: { x: j, y: move.start ?? 0 },
								end: { x: j, y: move.end ?? 0 },
							}))
						);
					}
				}
			}
		} else if (direction === DIRECTIONS.DOWN) {
			// Move down: tiles slide down and merge
			for (let j = 0; j < this.boardSize; j++) {
				const col = [];
				for (let i = 0; i < this.boardSize; i++) {
					col.push(newBoard[this.boardSize - 1 - i][j]);
				}

				// Only process if movement is possible
				if (this.canMove(col)) {
					const { result, moves } = this.collapseLine(col);

					// Only update if the column actually changed
					if (moves.length > 0) {
						for (let i = 0; i < this.boardSize; i++) {
							newBoard[this.boardSize - 1 - i][j] = result[i];
						}
						moveQueue.push(
							...moves.map((move) => ({
								...move,
								start: { x: j, y: result.length - 1 - (move.start ?? 0) },
								end: { x: j, y: result.length - 1 - (move.end ?? 0) },
							}))
						);
					}
				}
			}
		}

		// If a move was made, do some stuff
		if (moveQueue.length > 0) {
			this.#previousState = undoSnapshot;
			this.hasUndoSnapshot = true;

			// Add a snapshot of the board to the move queue and update state
			moveQueue.push({ snapshot: newBoard });
			this.board = newBoard;
			this.moveCount += 1;
			if (this.moves) {
				this.moves = [...this.moves, direction];
			}
			if (this.undoCooldownRemaining > 0) {
				this.undoCooldownRemaining -= 1;
			}

			// Update win state and add events
			if (!this.won && this.checkWin()) {
				moveQueue.push({ gameWon: true });
			}

			// Spawn a new tile and take another snapshot
			const tileAddMove = this.addNewTile();
			if (tileAddMove) {
				moveQueue.push({ ...tileAddMove });
				moveQueue.push({ snapshot: this.board });
			}

			// Update game over state and add event
			if (this.checkGameOver()) {
				moveQueue.push({ gameLost: true });
			}
		}

		return moveQueue;
	}

	/**
	 * Rotate the board clockwise by 90° × factor (records one CW or CCW action when factor is 1 or 3).
	 * @param {number} factor Factor to rotate the board clockwise by (0-3)
	 * @returns {import("./types").GameEvent[]}
	 */
	rotateBoard(factor) {
		const turns = ((factor % 4) + 4) % 4;
		if (turns === 0) return [];
		if (turns === 1) return this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CW);
		if (turns === 3) return this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CCW);

		// 180° — record as two CW turns so replay stays a sequence of atomic actions
		const events = [];
		for (let i = 0; i < turns; i++) {
			events.push(...this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CW));
		}
		return events;
	}

	/**
	 * Mirror the board horizontally (left ↔ right).
	 * @returns {import("./types").GameEvent[]}
	 */
	mirrorBoardHorizontally() {
		return this.applyBoardTransform(BOARD_TRANSFORMS.MIRROR_H);
	}

	/**
	 * Mirror the board vertically (top ↔ bottom).
	 * @returns {import("./types").GameEvent[]}
	 */
	mirrorBoardVertically() {
		return this.applyBoardTransform(BOARD_TRANSFORMS.MIRROR_V);
	}

	/**
	 * Get the game as a JSON object for saving to the db.
	 * Note: `complete` mirrors board-full game over only. A win with Keep Playing
	 * stays incomplete until game over or the run is finalized (e.g. New Game).
	 * @returns {Omit<import("./types").GameSaveData, "playerId">}
	 */
	json() {
		return {
			id: this.id,
			board: this.board,
			score: this.score,
			complete: this.gameOver,
			won: this.won,
			seed: this.seed,
			rngState: this.rng.state,
			moveCount: this.moveCount,
			undoCooldownRemaining: this.undoCooldownRemaining,
			moves: this.moves,
		};
	}
}
