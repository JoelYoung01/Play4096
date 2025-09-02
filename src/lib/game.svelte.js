export const TWO_TO_FOUR_RATIO = 0.5;

export const DEFAULT_BOARD_SIZE = 4;

export const DIRECTIONS = {
	LEFT: 10,
	RIGHT: 20,
	UP: 30,
	DOWN: 40,
};

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

export class Game {
	constructor(boardSize = DEFAULT_BOARD_SIZE) {
		this.boardSize = boardSize;
		this.board = $state(
			Array(boardSize)
				.fill(null)
				.map(() => Array(boardSize).fill(0))
		);
		this.score = $state(0);
		this.gameOver = $state(false);
		this.won = $state(false);
		this.canContinue = $state(false);

		this.addNewTile();
		this.addNewTile();
	}

	/**
	 * Check if player has won
	 * @returns {boolean}
	 */
	checkWin() {
		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				if (this.board[i][j] === 2048) {
					this.won = true;
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
		}
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
			if (line[i] === line[i + 1] || line[i] === 0) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Move and merge tiles in one direction
	 * @param {number[]} inputLine
	 * @returns {number[]}
	 */
	collapseLine(inputLine) {
		let lastPlaced = 0;
		let current = 1;
		let line = [...inputLine];

		// For each tile, move it to the 'end'
		while (current < line.length) {
			// If the current tile is empty, skip it
			if (line[current] === 0) {
				// do nothing
			}

			// If the last placed tile is empty, move the current tile to the last placed tile
			else if (line[lastPlaced] === 0) {
				line[lastPlaced] = line[current];
				line[current] = 0;
			}

			// If the last placed tile is the same as the current tile, merge them
			else if (line[lastPlaced] === line[current]) {
				line[lastPlaced] *= 2;
				line[current] = 0;
				this.score += line[lastPlaced];
				lastPlaced++;
			}

			// If the last placed is different, move the current tile to the space after the last placed tile
			else if (lastPlaced + 1 !== current) {
				line[lastPlaced + 1] = line[current];
				line[current] = 0;
				lastPlaced++;
			}

			// If the last placed is the same as the current, mark current tile as placed.
			else {
				lastPlaced++;
			}

			current++;
		}

		return line;
	}

	/**
	 * Move tiles in a specific direction
	 * @param {number} direction
	 */
	moveTiles(direction) {
		if (this.gameOver) return;

		let moved = false;
		const newBoard = this.board.map((row) => [...row]);

		if (direction === DIRECTIONS.LEFT) {
			// Move left: tiles slide to the left and merge
			for (let i = 0; i < this.boardSize; i++) {
				const originalRow = [...newBoard[i]];

				// Only process if movement is possible
				if (this.canMove(originalRow)) {
					const newRow = this.collapseLine(originalRow);

					// Only update if the row actually changed
					if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
						moved = true;
						newBoard[i] = newRow;
					}
				}
			}
		} else if (direction === DIRECTIONS.RIGHT) {
			// Move right: tiles slide to the right and merge
			for (let i = 0; i < this.boardSize; i++) {
				const originalRow = [...newBoard[i]].toReversed();

				// Only process if movement is possible
				if (this.canMove(originalRow)) {
					const newRow = this.collapseLine(originalRow);

					// Only update if the row actually changed
					if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
						moved = true;
						newBoard[i] = newRow.toReversed();
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
					const newCol = this.collapseLine(col);

					// Only update if the column actually changed
					if (JSON.stringify(col) !== JSON.stringify(newCol)) {
						moved = true;
						// Update the column
						for (let i = 0; i < this.boardSize; i++) {
							newBoard[i][j] = newCol[i];
						}
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
					const newCol = this.collapseLine(col);

					// Only update if the column actually changed
					if (JSON.stringify(col) !== JSON.stringify(newCol)) {
						moved = true;
						// Update the column
						for (let i = 0; i < this.boardSize; i++) {
							newBoard[this.boardSize - 1 - i][j] = newCol[i];
						}
					}
				}
			}
		}

		if (moved) {
			this.board = newBoard;
			this.addNewTile();
			this.checkWin();

			if (this.checkGameOver()) {
				this.gameOver = true;
			}
		}
	}
}
