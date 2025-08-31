<script>
	import { onMount } from "svelte";

	// Game state
	let board = $state(
		Array(4)
			.fill(null)
			.map(() => Array(4).fill(0))
	);
	let score = $state(0);
	let bestScore = $state(0);
	let gameOver = $state(false);
	let won = $state(false);
	let canContinue = $state(false);
	let mergingTiles = $state(new Set());

	// Animation state for smooth tile movement
	let tileAnimations = $state(new Map());
	let animationId = $state(0);

	// Initialize the game
	function initGame() {
		board = Array(4)
			.fill(null)
			.map(() => Array(4).fill(0));
		score = 0;
		gameOver = false;
		won = false;
		canContinue = false;
		mergingTiles.clear();
		addNewTile();
		addNewTile();
	}

	// Add a new tile (2 or 4) to a random empty position
	function addNewTile() {
		const emptyCells = [];
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (board[i][j] === 0) {
					emptyCells.push({ row: i, col: j });
				}
			}
		}

		if (emptyCells.length > 0) {
			const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
			board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
		}
	}

	// Check if the game is over
	function checkGameOver() {
		// Check if there are empty cells
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (board[i][j] === 0) return false;
			}
		}

		// Check if any moves are possible
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 3; j++) {
				if (board[i][j] === board[i][j + 1]) return false;
			}
		}

		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 4; j++) {
				if (board[i][j] === board[i + 1][j]) return false;
			}
		}

		return true;
	}

	// Check if player has won
	function checkWin() {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (board[i][j] === 2048) {
					won = true;
					return true;
				}
			}
		}
		return false;
	}

	// Move tiles in a specific direction
	function moveTiles(direction) {
		if (gameOver) return;

		let moved = false;
		const newBoard = board.map((row) => [...row]);

		// Helper function to check if a line can move
		function canMove(line, isReversed = false) {
			const nonZero = line.filter((cell) => cell !== 0);

			// If there are no non-zero tiles, no movement possible
			if (nonZero.length === 0) return false;

			// If there are gaps (zeros) between tiles, movement is possible
			if (nonZero.length < line.length) return true;

			// Check if any adjacent tiles can merge
			for (let i = 0; i < nonZero.length - 1; i++) {
				if (nonZero[i] === nonZero[i + 1]) return true;
			}

			return false;
		}

		// Helper function to move and merge tiles in one direction
		function moveLine(line, isReversed = false) {
			// Remove zeros
			let tiles = line.filter((cell) => cell !== 0);

			// Merge adjacent tiles (only once per move)
			for (let i = 0; i < tiles.length - 1; i++) {
				if (tiles[i] === tiles[i + 1]) {
					tiles[i] *= 2;
					score += tiles[i];
					tiles.splice(i + 1, 1);
				}
			}

			// Pad with zeros
			while (tiles.length < 4) {
				tiles.push(0);
			}

			// Reverse if needed
			if (isReversed) {
				tiles.reverse();
			}

			return tiles;
		}

		if (direction === "left") {
			// Move left: tiles slide to the left and merge
			for (let i = 0; i < 4; i++) {
				const originalRow = [...newBoard[i]];

				// Only process if movement is possible
				if (canMove(originalRow, false)) {
					const newRow = moveLine(originalRow, false);

					// Only update if the row actually changed
					if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
						moved = true;
						newBoard[i] = newRow;
					}
				}
			}
		} else if (direction === "right") {
			// Move right: tiles slide to the right and merge
			for (let i = 0; i < 4; i++) {
				const originalRow = [...newBoard[i]];

				// Only process if movement is possible
				if (canMove(originalRow, true)) {
					const newRow = moveLine(originalRow, true);

					// Only update if the row actually changed
					if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
						moved = true;
						newBoard[i] = newRow;
					}
				}
			}
		} else if (direction === "up") {
			// Move up: tiles slide up and merge
			for (let j = 0; j < 4; j++) {
				const col = [];
				for (let i = 0; i < 4; i++) {
					col.push(newBoard[i][j]);
				}

				// Only process if movement is possible
				if (canMove(col, false)) {
					const newCol = moveLine(col, false);

					// Only update if the column actually changed
					if (JSON.stringify(col) !== JSON.stringify(newCol)) {
						moved = true;
						// Update the column
						for (let i = 0; i < 4; i++) {
							newBoard[i][j] = newCol[i];
						}
					}
				}
			}
		} else if (direction === "down") {
			// Move down: tiles slide down and merge
			for (let j = 0; j < 4; j++) {
				const col = [];
				for (let i = 0; i < 4; i++) {
					col.push(newBoard[i][j]);
				}

				// Only process if movement is possible
				if (canMove(col, true)) {
					const newCol = moveLine(col, true);

					// Only update if the column actually changed
					if (JSON.stringify(col) !== JSON.stringify(newCol)) {
						moved = true;
						// Update the column
						for (let i = 0; i < 4; i++) {
							newBoard[i][j] = newCol[i];
						}
					}
				}
			}
		}

		if (moved) {
			board = newBoard;
			addNewTile();
			checkWin();

			if (checkGameOver()) {
				gameOver = true;
			}

			// Update best score
			if (score > bestScore) {
				bestScore = score;
			}
		}
	}

	// Handle keyboard events
	function handleKeydown(event) {
		switch (event.key) {
			case "ArrowLeft":
				event.preventDefault();
				moveTiles("left");
				break;
			case "ArrowRight":
				event.preventDefault();
				moveTiles("right");
				break;
			case "ArrowUp":
				event.preventDefault();
				moveTiles("up");
				break;
			case "ArrowDown":
				event.preventDefault();
				moveTiles("down");
				break;
		}
	}

	// Handle touch/swipe events for mobile
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchEnd(event) {
		if (!touchStartX || !touchStartY) return;

		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;

		const diffX = touchStartX - touchEndX;
		const diffY = touchStartY - touchEndY;

		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0) moveTiles("left");
			else moveTiles("right");
		} else {
			if (diffY > 0) moveTiles("up");
			else moveTiles("down");
		}

		touchStartX = 0;
		touchStartY = 0;
	}

	// Continue playing after winning
	function continuePlaying() {
		canContinue = true;
	}

	// Handle tile merging animation
	function animateMerge(row, col) {
		const key = `${row}-${col}`;
		mergingTiles.add(key);
		setTimeout(() => {
			mergingTiles.delete(key);
		}, 300);
	}

	// Create smooth tile movement animation
	function animateTileMovement(oldBoard, newBoard) {
		// Just update the board immediately - let CSS handle the transitions
		board = newBoard;
		addNewTile();
		checkWin();

		if (checkGameOver()) {
			gameOver = true;
		}

		// Update best score
		if (score > bestScore) {
			bestScore = score;
		}
	}

	// Initialize game on mount
	onMount(() => {
		initGame();
		window.addEventListener("keydown", handleKeydown);

		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

<svelte:head>
	<title>2048 Game</title>
</svelte:head>

<div class="game-container" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
	<!-- Header -->
	<div class="header">
		<div class="title-section">
			<h1 class="game-title">2048</h1>
			<p class="subtitle">Join the tiles, get to 2048!</p>
		</div>

		<div class="scores-section">
			<div class="score-box">
				<div class="score-label">SCORE</div>
				<div class="score-value">{score}</div>
			</div>
			<div class="score-box">
				<div class="score-label">BEST</div>
				<div class="score-value">{bestScore}</div>
			</div>
		</div>
	</div>

	<!-- Game Controls -->
	<div class="controls">
		<button class="new-game-btn" onclick={initGame}>New Game</button>
	</div>

	<!-- Game Board -->
	<div class="game-board">
		{#each board as row, rowIndex}
			{#each row as cell, colIndex}
				{@const tileKey = `${rowIndex}-${colIndex}`}

				{#if cell !== 0}
					<div
						class="tile {`tile-${cell}`}"
						class:tile-2={cell === 2}
						class:tile-4={cell === 4}
						class:tile-8={cell === 8}
						class:tile-16={cell === 16}
						class:tile-32={cell === 32}
						class:tile-64={cell === 64}
						class:tile-128={cell === 128}
						class:tile-256={cell === 256}
						class:tile-512={cell === 512}
						class:tile-1024={cell === 1024}
						class:tile-2048={cell === 2048}
						class:merging={mergingTiles.has(tileKey)}
					>
						{cell}
					</div>
				{:else}
					<div class="tile empty"></div>
				{/if}
			{/each}
		{/each}
	</div>

	<!-- Game Overlay -->
	{#if gameOver}
		<div class="overlay game-over">
			<div class="overlay-content">
				<h2>Game Over!</h2>
				<p>Final Score: {score}</p>
				<button class="overlay-btn" onclick={initGame}>Try Again</button>
			</div>
		</div>
	{/if}

	{#if won && !canContinue}
		<div class="overlay win">
			<div class="overlay-content">
				<h2>You Won!</h2>
				<p>Score: {score}</p>
				<button class="overlay-btn" onclick={continuePlaying}>Keep Playing</button>
				<button class="overlay-btn secondary" onclick={initGame}>New Game</button>
			</div>
		</div>
	{/if}

	<!-- Instructions -->
	<div class="instructions">
		<p>
			<strong>How to play:</strong> Use arrow keys or swipe to move tiles. When two tiles with the same
			number touch, they merge into one!
		</p>
	</div>
</div>

<style>
	.game-container {
		max-width: 500px;
		margin: 0 auto;
		padding: 20px;
		font-family: "Arial", sans-serif;
		user-select: none;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	.title-section {
		flex: 1;
	}

	.game-title {
		font-size: 3rem;
		font-weight: bold;
		margin: 0;
		color: #776e65;
	}

	.subtitle {
		margin: 5px 0 0 0;
		color: #776e65;
		font-size: 0.9rem;
	}

	.scores-section {
		display: flex;
		gap: 10px;
	}

	.score-box {
		background: #bbada0;
		padding: 10px 15px;
		border-radius: 6px;
		text-align: center;
		min-width: 80px;
	}

	.score-label {
		color: #eee4da;
		font-size: 0.8rem;
		font-weight: bold;
		text-transform: uppercase;
	}

	.score-value {
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
		margin-top: 5px;
	}

	.controls {
		margin-bottom: 20px;
		text-align: center;
	}

	.new-game-btn {
		background: #8f7a66;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.new-game-btn:hover {
		background: #7f6a56;
	}

	.game-board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 10px;
		background: #bbada0;
		padding: 10px;
		border-radius: 8px;
		margin-bottom: 20px;
		aspect-ratio: 1;
	}

	.tile {
		background: #cdc1b4;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
		color: #776e65;
		transition: all 0.15s ease;
		position: relative;
		animation: tileAppear 0.2s ease-out;
	}

	@keyframes tileAppear {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.tile.merging {
		animation: tileMerge 0.3s ease-out;
	}

	@keyframes tileMerge {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	.tile.empty {
		background: #cdc1b4;
	}

	.tile-2 {
		background: #eee4da;
		color: #776e65;
	}

	.tile-4 {
		background: #ede0c8;
		color: #776e65;
	}

	.tile-8 {
		background: #f2b179;
		color: #f9f6f2;
	}

	.tile-16 {
		background: #f59563;
		color: #f9f6f2;
	}

	.tile-32 {
		background: #f67c5f;
		color: #f9f6f2;
	}

	.tile-64 {
		background: #f65e3b;
		color: #f9f6f2;
	}

	.tile-128 {
		background: #edcf72;
		color: #f9f6f2;
		font-size: 1.8rem;
	}

	.tile-256 {
		background: #edcc61;
		color: #f9f6f2;
		font-size: 1.8rem;
	}

	.tile-512 {
		background: #edc850;
		color: #f9f6f2;
		font-size: 1.8rem;
	}

	.tile-1024 {
		background: #edc53f;
		color: #f9f6f2;
		font-size: 1.5rem;
	}

	.tile-2048 {
		background: #edc22e;
		color: #f9f6f2;
		font-size: 1.5rem;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.overlay-content {
		background: white;
		padding: 40px;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
	}

	.overlay-content h2 {
		margin: 0 0 20px 0;
		color: #776e65;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: #776e65;
		font-size: 1.2rem;
	}

	.overlay-btn {
		background: #8f7a66;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		margin: 0 10px 10px 0;
		transition: background-color 0.2s;
	}

	.overlay-btn:hover {
		background: #7f6a56;
	}

	.overlay-btn.secondary {
		background: #bbada0;
	}

	.overlay-btn.secondary:hover {
		background: #ab9d90;
	}

	.instructions {
		text-align: center;
		color: #776e65;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	/* Responsive design */
	@media (max-width: 600px) {
		.game-container {
			padding: 10px;
		}

		.game-title {
			font-size: 2.5rem;
		}

		.scores-section {
			flex-direction: column;
			gap: 5px;
		}

		.score-box {
			min-width: 60px;
			padding: 8px 12px;
		}

		.score-value {
			font-size: 1.2rem;
		}

		.tile {
			font-size: 1.5rem;
		}

		.tile-128,
		.tile-256,
		.tile-512 {
			font-size: 1.3rem;
		}

		.tile-1024,
		.tile-2048 {
			font-size: 1.1rem;
		}
	}
</style>
