<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";

	import { Game, isSameGame } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { saveGame as localSaveGame } from "$lib/localStorage.svelte.js";

	import BasicBoard from "./components/BasicBoard.svelte";
	import { browser } from "$app/environment";
	import { gameState } from "./state.svelte";
	import Overlay from "$lib/components/Overlay.svelte";

	const { data } = $props();

	const TOUCH_THRESHOLD = 5;
	const SAVE_DEBOUNCE_MS = 3000;
	let conflict = $state(false);

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);

	// Debounced save to API
	/** @type {ReturnType<typeof setTimeout> | null} */
	let saveTimeout = null;

	/**
	 * Try to load game from local or server storage
	 *
	 * Triggers conflict if necessary
	 */
	function tryLoadGame() {
		if (!browser) return;

		if (data.localGame && data.dbGame) {
			if (!isSameGame(data.localGame, data.dbGame)) {
				gameState.currentGame = null;
				conflict = true;
			} else {
				// This is what usually will happen. Prefer db game data.
				gameState.currentGame = new Game({ initialState: data.dbGame });
			}
		} else if (data.localGame) {
			gameState.currentGame = new Game({ initialState: data.localGame });
		} else if (data.dbGame) {
			gameState.currentGame = new Game({ initialState: data.dbGame });
		} else {
			gameState.currentGame = new Game();
		}
	}

	/**
	 * Resolve conflict between local and server game
	 * @param {'local' | 'server'} source
	 */
	function resolveConflict(source) {
		if (source === "local") {
			gameState.currentGame = new Game({ initialState: data.localGame });
		} else if (source === "server") {
			gameState.currentGame = new Game({ initialState: data.dbGame });
		}
		conflict = false;
	}

	/**
	 * Get the last updated date of a game
	 * @param  {{ lastUpdated: number } | null} game
	 */
	function getLastUpdated(game) {
		if (!game) return "-";

		if (game.lastUpdated) {
			return new Date(game.lastUpdated).toLocaleString();
		}
		return "-";
	}

	/**
	 * Save game to server API with debouncing
	 * @param {import("$lib/game.svelte.js").Game} game
	 */
	async function saveGameToServer(game) {
		if (!page.data.user) return; // Only save if user is logged in

		const gameData = game.json();

		try {
			const response = await fetch("/api/game/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(gameData),
			});
			if (!response.ok) {
				throw new Error(`Failed to save game to server: ${response.statusText}`);
			}
			const data = await response.json();
			if (!data.success) {
				throw new Error(`Failed to save game to server: ${data.error}`);
			}

			game.id = data.gameId;
		} catch (error) {
			console.error("Failed to save game to server:", error);
		}
	}

	/**
	 * Debounced version of saveGameToServer
	 * @param {import("$lib/game.svelte.js").Game} game
	 */
	function debouncedSaveGameToServer(game) {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(() => {
			saveGameToServer(game);
		}, SAVE_DEBOUNCE_MS);
	}

	// Update best score and save board to localstorage
	$effect(() => {
		if (!gameState.currentGame) return;
		localSaveGame(gameState.currentGame);
		if (gameState.currentGame.score > gameState.bestScore) {
			gameState.bestScore = gameState.currentGame.score;
		}

		// Save to server with debouncing
		debouncedSaveGameToServer(gameState.currentGame);
	});

	/**
	 * Handle move
	 * @param {number} direction
	 * @param direction
	 */
	function handleMove(direction) {
		if (!gameState.currentGame) return;

		const events = gameState.currentGame.moveTiles(direction);
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

		// Prevent default behavior
		event.preventDefault();
		event.stopPropagation();

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
		event.preventDefault();
		event.stopPropagation();
	}

	// Setup listeners on mount
	onMount(() => {
		tryLoadGame();

		window.addEventListener("keydown", handleKeydown);

		return () => {
			window.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

<Overlay bind:show={conflict} persistent>
	<div class="bg-background flex flex-col gap-2 rounded-2xl p-2">
		<p class="w-full text-center">Uh oh! We've detected two active games for this device!</p>
		<p class="w-full text-center">Please pick which game you would like to keep:</p>
		<div class="flex w-full gap-2 pt-2 pb-4">
			<div class="flex-1/2 text-center">
				<h3 class="text-lg font-bold">Local Game</h3>
				<p><span class="font-bold">Score:</span> {data.localGame?.score.toLocaleString() || "-"}</p>
				<p>
					<span class="font-bold">Last Updated:</span>
					{getLastUpdated(data.localGame)}
				</p>
				<button
					class="bg-primary hover:bg-primary-dark rounded-full p-2 text-white"
					onclick={() => resolveConflict("local")}
				>
					Keep Local Game
				</button>
			</div>
			<div class="flex-1/2 text-center">
				<h3 class="text-lg font-bold">User Game</h3>
				<p><span class="font-bold">Score:</span> {data.dbGame?.score.toLocaleString() || "-"}</p>
				<p>
					<span class="font-bold">Last Updated:</span>
					{getLastUpdated(data.dbGame)}
				</p>
				<button
					class="bg-primary hover:bg-primary-dark rounded-full p-2 text-white"
					onclick={() => resolveConflict("server")}
				>
					Keep User Game
				</button>
			</div>
		</div>
	</div>
</Overlay>

<div
	class="game-container"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<!-- Game Board -->
	<BasicBoard {pendingEvents} />

	<!-- Instructions -->
	<div class="text-center text-sm" style:color={page.data.theme?.textLight}>
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
		font-weight: 500;
		margin: 0 auto;
		padding: 20px;
		user-select: none;
		color: var(--text-color);

		/* Prevent browser gestures and scrolling */
		touch-action: manipulation;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		-webkit-overscroll-behavior: contain;
	}
</style>
