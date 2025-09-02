<script>
	import { Game, DIRECTIONS } from "$lib/game.svelte.js";
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
	<div class="header">
		<div class="title-section">
			<h1 class="game-title">4096</h1>
			<p class="subtitle">Join the tiles, get to 4096!</p>
		</div>

		<div class="scores-section">
			<div class="score-box">
				<div class="score-label">SCORE</div>
				<div class="score-value">{game.score}</div>
			</div>
			<div class="score-box">
				<div class="score-label">BEST</div>
				<div class="score-value">{bestScore}</div>
			</div>
		</div>
	</div>

	<!-- Game Controls -->
	<div class="controls">
		<button class="new-game-btn" onclick={newGame}>New Game</button>
	</div>

	<!-- Game Board -->
	<div class="game-board">
		{#each game.board as row, rowIndex}
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
						class:tile-4096={cell === 4096}
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

<style>
	.game-container {
		max-width: 500px;
		min-height: 100vh;
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
		font-size: 3.5rem;
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

	.tile-4096 {
		background: #5eda92;
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
