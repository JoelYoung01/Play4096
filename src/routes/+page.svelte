<script>
	import { Game, DIRECTIONS, TILE_COLORS } from "$lib/game.svelte.js";
	import { onMount } from "svelte";

	const TOUCH_THRESHOLD = 5;

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

		// Check if the touch started within the game board area
		const gameBoard = document.querySelector(".game-board");
		if (gameBoard && event.target) {
			// Prevent default behavior only when swiping within the game board
			event.preventDefault();
			event.stopPropagation();
		}

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
	 * Handle touch move events to prevent scrolling during swipe
	 * @param {TouchEvent} event
	 */
	function handleTouchMove(event) {
		// Check if the touch started within the game board area
		const gameBoard = document.querySelector(".game-board");
		if (gameBoard && event.target && touchStartX && touchStartY) {
			// Prevent default behavior only when swiping within the game board
			event.preventDefault();
			event.stopPropagation();
		}
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
		const mobile = typeof window !== "undefined" && window.innerWidth <= 600;
		const baseSize = mobile ? 2.5 : 3;
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
	function getTileColor(value, threshold = 0.7) {
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
		return lum < threshold ? "#f9f6f2" : "#776e65";
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

<div
	class="game-container"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<!-- Header -->
	<div class="mb-3 flex items-start justify-between">
		<div>
			<h1 class="game-title text-4xl font-bold">4096</h1>
			<p class="game-description">Join the tiles, get to 4096!</p>
		</div>

		<div class="flex gap-2">
			<div class="score-box rounded-md p-2 text-center">
				<div class="font-bold uppercase">SCORE</div>
				<div class="score-value mt-1 font-bold">{game.score}</div>
			</div>
			<div class="score-box rounded-md p-2 text-center">
				<div class="font-bold uppercase">BEST</div>
				<div class="score-value mt-1 font-bold">{bestScore}</div>
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
		/* Prevent browser gestures and scrolling */
		touch-action: manipulation;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		-webkit-overscroll-behavior: contain;
	}

	.game-title {
		font-size: 3rem;

		@media (max-width: 600px) {
			font-size: 2.5rem;
		}
	}

	.game-description {
		font-size: 1.2rem;

		@media (max-width: 600px) {
			font-size: 0.75rem;
		}
	}

	.score-box {
		background: var(--board-bg);
		color: var(--background-color);
		flex: 0 0 80px;
		font-size: 1.2rem;

		@media (max-width: 600px) {
			font-size: 0.75rem;
		}
	}

	.score-value {
		font-size: 1.2rem;

		@media (max-width: 600px) {
			font-size: 1rem;
		}
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
		/* Prevent Chrome's pull-to-refresh and other touch gestures */
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		/* Additional gesture prevention */
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		-webkit-overscroll-behavior: contain;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
		user-drag: none;
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

		.score-box {
			min-width: 60px;
			padding: 8px 12px;
		}
	}
</style>
