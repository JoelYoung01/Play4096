<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";

	import { Game, isSameGame } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { saveGame as localSaveGame } from "$lib/localStorage.svelte.js";

	import AnimatedBoard from "./components/AnimatedBoard.svelte";
	import { browser } from "$app/environment";
	import { gameState } from "./state.svelte";
	import Overlay from "$lib/components/Overlay.svelte";

	const { data } = $props();

	const TOUCH_THRESHOLD = 5;
	/** Max staleness for server saves while actively playing */
	const SAVE_THROTTLE_MS = 1000;
	let conflict = $state(false);

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);

	/** @type {ReturnType<typeof setTimeout> | null} */
	let saveTimeout = null;
	/** @type {import("$lib/game.svelte.js").Game | null} */
	let pendingServerSave = null;
	let lastServerSaveAt = 0;

	/**
	 * Create a Game, preserving server id when local is missing one
	 * @param {import("$lib/types").GameState | null | undefined} state
	 * @param {string | undefined} [fallbackId]
	 */
	function createGameFromState(state, fallbackId) {
		return new Game({
			id: state?.id ?? fallbackId,
			initialState: state,
		});
	}

	/**
	 * Try to load game from local or server storage.
	 *
	 * When boards diverge, prefer the newer timestamp and only prompt
	 * when timestamps are missing (true ambiguity).
	 */
	function tryLoadGame() {
		if (!browser) return;

		if (data.localGame && data.dbGame) {
			if (isSameGame(data.localGame, data.dbGame)) {
				gameState.currentGame = createGameFromState(data.dbGame);
				return;
			}

			const localUpdated = data.localGame.lastUpdated;
			const dbUpdated = data.dbGame.lastUpdated;

			if (typeof localUpdated === "number" && typeof dbUpdated === "number") {
				if (localUpdated >= dbUpdated) {
					// Local is ahead (common after a missed flush) — keep it and push.
					gameState.currentGame = createGameFromState(data.localGame, data.dbGame.id);
					queueMicrotask(() => flushSaveToServer());
				} else {
					gameState.currentGame = createGameFromState(data.dbGame);
				}
				return;
			}

			gameState.currentGame = null;
			conflict = true;
		} else if (data.localGame) {
			gameState.currentGame = createGameFromState(data.localGame);
		} else if (data.dbGame) {
			gameState.currentGame = createGameFromState(data.dbGame);
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
			gameState.currentGame = createGameFromState(data.localGame, data.dbGame?.id);
			queueMicrotask(() => flushSaveToServer());
		} else if (source === "server") {
			gameState.currentGame = createGameFromState(data.dbGame);
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
	 * Persist current game snapshot to the server
	 * @param {import("$lib/game.svelte.js").Game} game
	 * @param {{ keepalive?: boolean }} [options]
	 */
	async function saveGameToServer(game, { keepalive = false } = {}) {
		if (!page.data.user) return;

		const gameData = game.json();

		try {
			const response = await fetch("/api/game/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(gameData),
				keepalive,
			});
			if (!response.ok) {
				throw new Error(`Failed to save game to server: ${response.statusText}`);
			}
			const result = await response.json();
			if (!result.success) {
				throw new Error(`Failed to save game to server: ${result.error}`);
			}

			if (result.id) {
				game.id = result.id;
				// Refresh local snapshot so id survives reloads before the next effect tick
				localSaveGame(game);
			}
		} catch (error) {
			console.error("Failed to save game to server:", error);
		}
	}

	/**
	 * Immediately flush any pending server save (used on hide/unload and conflict resolve)
	 * @param {{ keepalive?: boolean }} [options]
	 */
	function flushSaveToServer({ keepalive = false } = {}) {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		const game = pendingServerSave ?? gameState.currentGame;
		if (!game || !page.data.user) return;

		pendingServerSave = null;
		lastServerSaveAt = Date.now();
		return saveGameToServer(game, { keepalive });
	}

	/**
	 * Throttled server save: at most once per SAVE_THROTTLE_MS while playing
	 * @param {import("$lib/game.svelte.js").Game} game
	 */
	function scheduleSaveToServer(game) {
		if (!page.data.user) return;

		pendingServerSave = game;
		const elapsed = Date.now() - lastServerSaveAt;

		if (elapsed >= SAVE_THROTTLE_MS) {
			flushSaveToServer();
			return;
		}

		if (!saveTimeout) {
			saveTimeout = setTimeout(() => {
				saveTimeout = null;
				flushSaveToServer();
			}, SAVE_THROTTLE_MS - elapsed);
		}
	}

	/**
	 * Flush when the tab is backgrounded or unloaded so local doesn't outrun the server
	 */
	function handleLifecycleFlush() {
		flushSaveToServer({ keepalive: true });
	}

	/**
	 * @param {Event} _event
	 */
	function handleVisibilityChange(_event) {
		if (document.visibilityState === "hidden") {
			handleLifecycleFlush();
		}
	}

	// Update best score and save board to localstorage
	$effect(() => {
		if (!gameState.currentGame) return;
		localSaveGame(gameState.currentGame);
		if (gameState.currentGame.score > gameState.bestScore) {
			gameState.bestScore = gameState.currentGame.score;
		}

		scheduleSaveToServer(gameState.currentGame);
	});

	/**
	 * Pop the next pending animation event
	 * @returns {import("$lib/types").GameEvent | undefined}
	 */
	function popEvent() {
		return pendingEvents.shift();
	}

	/**
	 * Handle move
	 * @param {number} direction
	 */
	function handleMove(direction) {
		if (!gameState.currentGame) return;

		const events = gameState.currentGame.moveTiles(direction);
		if (events.length > 0) {
			pendingEvents.push(...events);
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
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("pagehide", handleLifecycleFlush);

		return () => {
			window.removeEventListener("keydown", handleKeydown);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("pagehide", handleLifecycleFlush);
			flushSaveToServer({ keepalive: true });
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
	<AnimatedBoard {pendingEvents} {popEvent} />

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
