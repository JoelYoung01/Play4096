<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";

	import { Game } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { saveBoard } from "$lib/localStorage.svelte.js";

	import BasicBoard from "$lib/BasicBoard.svelte";
	import { browser } from "$app/environment";
	import { gameState } from "./state.svelte";

	const TOUCH_THRESHOLD = 5;

	/** @type {import("$lib/game.svelte.js").Game | null} */
	let game = $state(null);

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);

	if (browser) {
		game = new Game({ initialState: page.data.currentGame });
	}

	// Update best score and save board to localstorage
	$effect(() => {
		if (!game) return;
		saveBoard(game.board);
		if (game.score > gameState.bestScore) {
			gameState.bestScore = game.score;
		}
	});

	/**
	 * Handle move
	 * @param {number} direction
	 * @param direction
	 */
	function handleMove(direction) {
		if (!game) return;

		const events = game.moveTiles(direction);
		if (events) {
			pendingEvents = events;
		}
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
	 * Create a new game
	 */
	function newGame() {
		game = new Game();
	}

	/**
	 * Continue playing after winning
	 */
	function continueGame() {
		if (!game) return;

		game.canContinue = true;
	}

	// Setup listeners on mount
	onMount(() => {
		window.addEventListener("keydown", handleKeydown);

		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

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
				<div class="score-value mt-1 font-bold">{game?.score ?? "-"}</div>
			</div>
			<div class="score-box rounded-md p-2 text-center">
				<div class="font-bold uppercase">BEST</div>
				<div class="score-value mt-1 font-bold">{gameState.bestScore ?? "-"}</div>
			</div>
		</div>
	</div>

	<!-- Game Controls -->
	<div class="mb-4 text-center">
		<button class="new-game-btn" onclick={newGame}>New Game</button>
	</div>

	<!-- Game Board -->
	<BasicBoard {game} {newGame} {pendingEvents} {continueGame} />

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
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
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
