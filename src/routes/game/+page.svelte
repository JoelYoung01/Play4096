<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";

	import { Game, isSameGame } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { saveGame as localSaveGame } from "$lib/localStorage.svelte.js";

	import AnimatedBoard from "./components/AnimatedBoard.svelte";
	import { browser } from "$app/environment";
	import { gameState } from "./state.svelte";
	import { createSwipeHandlers } from "$lib/swipe.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	const { data } = $props();
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
	/** @type {Promise<void> | null} */
	let inflightSavePromise = null;

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
	 * Persist a game save payload to the server
	 * @param {Omit<import("$lib/types").GameSaveData, "playerId">} gameData
	 * @param {{ keepalive?: boolean, game?: import("$lib/game.svelte.js").Game | null }} [options]
	 */
	async function persistGameDataToServer(gameData, { keepalive = false, game = null } = {}) {
		if (!page.data.user) return;

		const run = async () => {
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

				if (result.id && game) {
					game.id = result.id;
					// Refresh local snapshot so id survives reloads before the next effect tick
					localSaveGame(game.json());
				}
			} catch (error) {
				// Keepalive / tab-hide flushes and superseded in-flight saves often abort — not actionable.
				if (error instanceof DOMException && error.name === "AbortError") return;
				if (
					error instanceof TypeError &&
					/failed to fetch/i.test(error.message) &&
					(keepalive || document.visibilityState === "hidden")
				) {
					return;
				}
				console.error("Failed to save game to server:", error);
			}
		};

		// Serialize saves so an older incomplete write cannot land after finalize
		const previous = inflightSavePromise;
		const promise = (async () => {
			if (previous) await previous;
			await run();
		})();

		inflightSavePromise = promise.finally(() => {
			if (inflightSavePromise === promise) {
				inflightSavePromise = null;
			}
		});
		return inflightSavePromise;
	}

	/**
	 * Persist current game snapshot to the server
	 * @param {import("$lib/game.svelte.js").Game} game
	 * @param {{ keepalive?: boolean }} [options]
	 */
	async function saveGameToServer(game, { keepalive = false } = {}) {
		return persistGameDataToServer(game.json(), { keepalive, game });
	}

	/**
	 * Cancel any throttled (not yet sent) server save
	 */
	function cancelPendingServerSave() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		pendingServerSave = null;
	}

	/**
	 * Finalize the current run, then start a fresh game.
	 *
	 * Winning does not set complete (Keep Playing). New Game marks the abandoned
	 * run finished so only one active game remains and history shows a clean end.
	 */
	async function handleNewGame() {
		const previous = gameState.currentGame;
		cancelPendingServerSave();

		// Let any in-flight incomplete save finish before writing complete:true
		if (inflightSavePromise) {
			await inflightSavePromise;
		}

		if (previous && previous.moveCount > 0 && page.data.user) {
			const snapshot = { ...previous.json(), complete: true };
			await persistGameDataToServer(snapshot);
		}

		pendingEvents.splice(0, pendingEvents.length);
		gameState.hasCheckpoint = false;
		gameState.currentGame = new Game();
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

	function handleVisibilityChange() {
		if (document.visibilityState === "hidden") {
			handleLifecycleFlush();
		}
	}

	/**
	 * Ensure the current game has a persisted id before checkpoint ops
	 * @returns {Promise<string | null>}
	 */
	async function ensurePersistedGameId() {
		const game = gameState.currentGame;
		if (!game || !page.data.user) return null;

		await flushSaveToServer();
		if (game.id) return game.id;

		await saveGameToServer(game);
		return game.id ?? null;
	}

	/**
	 * Capture the current board as the active checkpoint for this run
	 */
	async function handleSetCheckpoint() {
		const game = gameState.currentGame;
		if (!game || !page.data.user) return;

		const gameId = await ensurePersistedGameId();
		if (!gameId) {
			console.error("Unable to set checkpoint: game is not saved");
			return;
		}

		const snapshot = game.json();
		try {
			const response = await fetch("/api/game/checkpoint", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					board: snapshot.board,
					score: snapshot.score,
					seed: snapshot.seed,
					rngState: snapshot.rngState,
					moveCount: snapshot.moveCount,
					undoCooldownRemaining: snapshot.undoCooldownRemaining,
					won: snapshot.won,
				}),
			});
			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.error || "Failed to set checkpoint");
			}
			gameState.hasCheckpoint = true;
		} catch (error) {
			console.error("Failed to set checkpoint:", error);
		}
	}

	/**
	 * Restore the latest active checkpoint into the current game
	 */
	async function handleRestoreCheckpoint() {
		const game = gameState.currentGame;
		if (!game?.id || !page.data.user) return;

		try {
			const response = await fetch("/api/game/checkpoint/restore", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameId: game.id }),
			});
			const result = await response.json();
			if (!response.ok || !result.success || !result.game) {
				throw new Error(result.error || "Failed to restore checkpoint");
			}

			gameState.currentGame = new Game({
				id: result.game.id,
				initialState: result.game,
			});
			gameState.hasCheckpoint = true;
			localSaveGame(gameState.currentGame.json());
			queueMicrotask(() => flushSaveToServer());
		} catch (error) {
			console.error("Failed to restore checkpoint:", error);
		}
	}

	// Update best score and save board to localstorage
	$effect(() => {
		if (!gameState.currentGame) return;
		localSaveGame(gameState.currentGame.json());
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

	const { handleTouchStart, handleTouchEnd, handleTouchMove } = createSwipeHandlers(handleMove);

	// Setup listeners on mount
	onMount(() => {
		gameState.hasCheckpoint = !!data.hasCheckpoint;
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

<Dialog.Root bind:open={conflict}>
	<Dialog.Content
		class="sm:max-w-2xl"
		showCloseButton={false}
		interactOutsideBehavior="ignore"
		escapeKeydownBehavior="ignore"
	>
		<Dialog.Header>
			<Dialog.Title class="text-center text-xl">Active game conflict</Dialog.Title>
			<Dialog.Description class="text-center text-muted-foreground">
				Uh oh! We've detected two active games for this device. Please pick which game you would
				like to keep:
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-lg border bg-muted/30 p-4 text-center">
				<h3 class="text-lg font-bold">Local Game</h3>
				<p><span class="font-bold">Score:</span> {data.localGame?.score.toLocaleString() || "-"}</p>
				<p class="mb-4">
					<span class="font-bold">Last Updated:</span>
					{getLastUpdated(data.localGame)}
				</p>
				<Button class="w-full rounded-full" onclick={() => resolveConflict("local")}>
					Keep Local Game
				</Button>
			</div>
			<div class="rounded-lg border bg-muted/30 p-4 text-center">
				<h3 class="text-lg font-bold">User Game</h3>
				<p><span class="font-bold">Score:</span> {data.dbGame?.score.toLocaleString() || "-"}</p>
				<p class="mb-4">
					<span class="font-bold">Last Updated:</span>
					{getLastUpdated(data.dbGame)}
				</p>
				<Button class="w-full rounded-full" onclick={() => resolveConflict("server")}>
					Keep User Game
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<div
	class="game-container"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<!-- Game Board -->
	<AnimatedBoard
		{pendingEvents}
		{popEvent}
		onNewGame={handleNewGame}
		onSetCheckpoint={handleSetCheckpoint}
		onRestoreCheckpoint={handleRestoreCheckpoint}
	/>

	<!-- Instructions -->
	<div class="text-center text-sm text-muted-foreground">
		<p>
			<strong>How to play:</strong> Use arrow keys or swipe to move tiles. When two tiles with the same
			number touch, they merge into one!
		</p>
	</div>
</div>

<style lang="postcss">
	.game-container {
		max-width: 500px;
		min-height: 100%;
		font-weight: 500;
		margin: 0 auto;
		padding: 20px;
		padding-bottom: 5rem;
		color: var(--foreground);
	}
</style>
