import { defaultTheme } from "./assets/themes";
import {
	DEFAULT_BOARD_SIZE,
	DEFAULT_STARTING_TILES,
	DIRECTIONS,
	TWO_TO_FOUR_RATIO,
} from "./constants";

export const TILE_COLORS = {
	2: "#eee4d9",
	4: "#ece0c8",
	8: "#f2b179",
	16: "#eb8e53",
	32: "#f67c5f",
	64: "#e95937",
	128: "#f3d96c",
	256: "#f1d14c",
	512: "#efd179",
	1024: "#eece69",
	2048: "#edc32e",
	4096: "#5eda92",
	8192: "#9fca46",
	16384: "#3E5641",
	32768: "#AD9BAA",
	65536: "#5BC0EB",
	131072: "#540D6E",
	262144: "#7B2D26",
	524288: "#065A82",
	1048576: "#F4F7BE",
	2097152: "#63A375",
};

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
	const bg = getTileBackground(value);

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

export class Game {
	constructor(boardSize = DEFAULT_BOARD_SIZE, startingTiles = DEFAULT_STARTING_TILES) {
		this.boardSize = boardSize;

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

		for (let i = 0; i < startingTiles; i++) {
			this.addNewTile();
		}
	}

	/**
	 * Check if player has won
	 * @returns {boolean}
	 */
	checkWin() {
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === 2048) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Add a new tile (2 or 4) to a random empty position
	 * @param {number | null} valueInput
	 */
	addNewTile(valueInput = null) {
		const value = valueInput ?? (Math.random() < TWO_TO_FOUR_RATIO ? 2 : 4);
		const emptyCells = [];
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === 0) {
					emptyCells.push({ row: i, col: j });
				}
			}
		}

		if (emptyCells.length > 0) {
			const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
			this.board[randomCell.row][randomCell.col] = value;
			return { end: { x: randomCell.col, y: randomCell.row }, value };
		}

		return null;
	}

	/**
	 * Check if the game is over
	 * @returns {boolean}
	 */
	checkGameOver() {
		// Check if there are empty cells
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === 0) return false;
			}
		}

		// Check if any moves are possible
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize - 1; j++) {
				if (this.board[i][j] === this.board[i][j + 1]) return false;
			}
		}

		for (let i = 0; i < this.boardSize - 1; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === this.board[i + 1][j]) return false;
			}
		}

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
			const value = line[current];
			// If the current tile is empty, skip it
			if (value === 0) {
				// do nothing
			}

			// If the last placed tile is empty and this tile isn't, move the current tile to the last placed tile
			else if (line[lastPlaced] === 0) {
				line[lastPlaced] = value;
				line[current] = 0;
				moveQueue.push({ start: current, end: lastPlaced, value });
			}

			// If the last placed tile is the same as the current tile, merge them
			else if (line[lastPlaced] === value) {
				line[lastPlaced] *= 2;
				line[current] = 0;
				this.score += line[lastPlaced];
				moveQueue.push({ start: current, end: lastPlaced, merged: true, value });
				lastPlaced++;
			}

			// If the last placed is different, move the current tile to the space after the last placed tile
			else if (lastPlaced + 1 !== current) {
				line[lastPlaced + 1] = value;
				line[current] = 0;
				lastPlaced++;
				moveQueue.push({ start: current, end: lastPlaced, value });
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

		if (this.checkGameOver()) {
			this.gameOver = true;
			moveQueue.push({ gameLost: true });
		}

		if (!this.gameOver && !this.won && this.checkWin()) {
			this.won = true;
			moveQueue.push({ gameWon: true });
		}

		if (!this.gameOver && moveQueue.length > 0) {
			moveQueue.push({ snapshot: newBoard });
			this.board = newBoard;

			// Only add a new tile if a move was made
			const tileAddMove = this.addNewTile();
			if (tileAddMove) {
				moveQueue.push({ ...tileAddMove });
				moveQueue.push({ snapshot: this.board });
			}
		}

		return moveQueue;
	}
}
