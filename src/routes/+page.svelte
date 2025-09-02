<script>
	import { Game, DIRECTIONS, TILE_COLORS } from "$lib/game.svelte.js";
	import { onMount } from "svelte";

	const TOUCH_THRESHOLD = 100;

	let game = $state(new Game());
	let bestScore = $state(0);

	/**
	 * Handle move
	 * @param {number} direction
	 * @param direction
	 */
	function handleMove(direction) {
		game.moveTiles(direction);
		bestScore = Math.max(bestScore, game.score);
	}

	/**
	 * Handle keyboard events
	 * @param {KeyboardEvent} event
	 */
	function handleKeydown(event) {
		switch (event.key) {
			case "ArrowLeft":
				event.preventDefault();
				handleMove(DIRECTIONS.LEFT);
				break;
			case "ArrowRight":
				event.preventDefault();
				handleMove(DIRECTIONS.RIGHT);
				break;
			case "ArrowUp":
				event.preventDefault();
				handleMove(DIRECTIONS.UP);
				break;
			case "ArrowDown":
				event.preventDefault();
				handleMove(DIRECTIONS.DOWN);
				break;
		}
	}

	// Handle touch/swipe events for mobile
	let touchStartX = 0;
	let touchStartY = 0;

	/**
	 * Handle touch/swipe events for mobile
	 * @param {TouchEvent} event
	 */
	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	/**
	 * Handle touch/swipe events for mobile
	 * @param {TouchEvent} event
	 */
	function handleTouchEnd(event) {
		if (!touchStartX || !touchStartY) return;

		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;

		const diffX = touchStartX - touchEndX;
		const diffY = touchStartY - touchEndY;

		if (Math.abs(diffX) < TOUCH_THRESHOLD && Math.abs(diffY) < TOUCH_THRESHOLD) return;

		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0) handleMove(DIRECTIONS.LEFT);
			else handleMove(DIRECTIONS.RIGHT);
		} else {
			if (diffY > 0) handleMove(DIRECTIONS.UP);
			else handleMove(DIRECTIONS.DOWN);
		}

		touchStartX = 0;
		touchStartY = 0;
	}

	/**
	 * Continue playing after winning
	 */
	function continuePlaying() {
		game.canContinue = true;
	}

	/**
	 * Create a new game
	 */
	function newGame() {
		game = new Game();
	}

	/**
	 * Get the font size for a tile
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileFontSize(value) {
		const baseSize = 3; // rem
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}

	/**
	 * Get the background color for a tile
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileBackground(value) {
		// @ts-expect-error
		if (value in TILE_COLORS) return TILE_COLORS[value];
		return "#5f5f5f";
	}

	/**
	 * Get the color for a tile
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileColor(value) {
		if (value >= 8) return "#f9f6f2";
		return "#776e65";
	}

	// Setup listeners on mount
	onMount(() => {
		window.addEventListener("keydown", handleKeydown);

		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

<svelte:head>
	<title>4096 Game</title>
</svelte:head>

<div class="game-container" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
	<!-- Header -->
	<div class="mb-3 flex items-start justify-between">
		<div>
			<h1 class="game-title text-4xl font-bold">4096</h1>
			<p>Join the tiles, get to 4096!</p>
		</div>

		<div class="flex gap-2">
			<div class="score-box rounded-md p-2 text-center text-sm">
				<div class="text-sm font-bold uppercase">SCORE</div>
				<div class="mt-1 text-2xl font-bold">{game.score}</div>
			</div>
			<div class="score-box rounded-md p-2 text-center text-sm">
				<div class="text-sm font-bold uppercase">BEST</div>
				<div class="mt-1 text-2xl font-bold">{bestScore}</div>
			</div>
		</div>
	</div>

	<!-- Game Controls -->
	<div class="mb-4 text-center">
		<button class="new-game-btn" onclick={newGame}>New Game</button>
	</div>

	<!-- Game Board -->
	<div class="game-board">
		{#each game.board as row, rowIndex (rowIndex)}
			{#each row as cell, colIndex (colIndex)}
				{#if cell !== 0}
					<div
						class="tile"
						style:font-size={getTileFontSize(cell)}
						style:background={getTileBackground(cell)}
						style:color={getTileColor(cell)}
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
	{#if game.gameOver}
		<div class="overlay game-over">
			<div class="overlay-content">
				<h2>Game Over!</h2>
				<p>Final Score: {game.score}</p>
				<button class="overlay-btn" onclick={newGame}>Try Again</button>
			</div>
		</div>
	{/if}

	{#if game.won && !game.canContinue}
		<div class="overlay win">
			<div class="overlay-content">
				<h2>You Won!</h2>
				<p>Score: {game.score}</p>
				<button class="overlay-btn" onclick={continuePlaying}>Keep Playing</button>
				<button class="overlay-btn secondary" onclick={newGame}>New Game</button>
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

<style lang="postcss">
	.game-container {
		max-width: 500px;
		min-height: 100vh;
		margin: 0 auto;
		padding: 20px;
		font-family: "Arial", sans-serif;
		user-select: none;
		color: var(--text-color);
	}

	.game-title {
		font-size: 3rem;
	}

	.scores-section {
		display: flex;
		gap: 10px;
	}

	.score-box {
		background: var(--board-bg);
		color: var(--background-color);
		min-width: 80px;
	}

	.new-game-btn {
		background: var(--primary-color);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: background-color 0.2s;

		&:hover {
			background: var(--primary-color-dark);
		}
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
		flex: 0 0 auto;
		overflow: hidden;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		color: #776e65;
		transition: all 0.15s ease;
		position: relative;
		animation: tileAppear 0.2s ease-out;
		white-space: normal;
		word-break: break-all;
		text-align: center;
		padding: 0.2em;
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

	.tile.empty {
		background: #cdc1b4;
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
