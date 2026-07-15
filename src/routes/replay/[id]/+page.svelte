<script>
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { Game } from "$lib/game.svelte.js";
	import AnimatedBoard from "../../game/components/AnimatedBoard.svelte";
	import {
		PauseIcon,
		PlayIcon,
		RotateCcwIcon,
		SkipForwardIcon,
		ChevronLeftIcon,
	} from "@lucide/svelte";

	let { data } = $props();

	const SPEED_OPTIONS = [1, 2, 4, 8];

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);
	let animationIdle = $state(true);
	let playing = $state(false);
	let speed = $state(2);
	let moveIndex = $state(0);
	/** @type {import("$lib/game.svelte.js").Game | null} */
	let replayGame = $state(null);
	/** @type {{ syncBoard: () => void } | null} */
	let boardRef = $state(null);

	let totalMoves = $derived(data.replay.moves.length);
	let atEnd = $derived(moveIndex >= totalMoves);
	let progressLabel = $derived(`${Math.min(moveIndex, totalMoves)} / ${totalMoves}`);

	/**
	 * Recreate the game from seed (opening tiles) — no final board
	 */
	function createReplayGame() {
		return new Game({ seed: data.replay.seed });
	}

	function resetReplay() {
		playing = false;
		pendingEvents = [];
		moveIndex = 0;
		replayGame = createReplayGame();
		queueMicrotask(() => boardRef?.syncBoard());
	}

	/**
	 * @returns {import("$lib/types").GameEvent | undefined}
	 */
	function popEvent() {
		return pendingEvents.shift();
	}

	/**
	 * Apply the next recorded direction and queue animation events
	 * @returns {boolean} Whether a move was applied
	 */
	function stepForward() {
		if (!replayGame || atEnd || pendingEvents.length > 0 || !animationIdle) return false;

		const direction = data.replay.moves[moveIndex];
		const events = replayGame.moveTiles(direction);
		if (events.length === 0) {
			// Corrupted / desynced move — stop playback
			playing = false;
			return false;
		}

		pendingEvents.push(...events);
		moveIndex += 1;
		return true;
	}

	function togglePlay() {
		if (atEnd) {
			resetReplay();
			playing = true;
			return;
		}
		playing = !playing;
	}

	function cycleSpeed() {
		const idx = SPEED_OPTIONS.indexOf(speed);
		speed = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
	}

	// Autoplay: when idle and playing, advance
	$effect(() => {
		if (!browser || !playing || !animationIdle || atEnd) {
			if (atEnd) playing = false;
			return;
		}

		const timer = setTimeout(() => {
			if (!stepForward()) {
				playing = false;
			}
		}, 16);

		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (!browser) return;
		// Initialize once from loaded replay data
		data.replay.id;
		resetReplay();
	});
</script>

<svelte:head>
	<title>Replay - 4096</title>
	<meta name="description" content="Watch a move-by-move replay of a completed 4096 game." />
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 pt-6 pb-28" style:color={page.data.theme?.primary}>
	<div class="mb-3 flex items-center gap-2">
		<a
			href="/replay"
			class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
		>
			<ChevronLeftIcon size={16} />
			History
		</a>
		<span class="text-sm text-gray-400">·</span>
		<span
			class="rounded-full px-2 py-0.5 text-xs font-bold {data.replay.won
				? 'bg-green-100 text-green-700'
				: 'bg-red-100 text-red-700'}"
		>
			{data.replay.won ? "Win" : "Loss"}
		</span>
		<span class="text-sm font-semibold text-gray-700">
			{data.replay.score.toLocaleString()} pts
		</span>
	</div>

	{#if replayGame}
		<div class="mb-2 flex items-center justify-between text-sm text-gray-600">
			<span>Score: <strong class="text-gray-900">{replayGame.score.toLocaleString()}</strong></span>
			<span>Move {progressLabel}</span>
		</div>

		<AnimatedBoard
			bind:this={boardRef}
			bind:animationIdle
			game={replayGame}
			{pendingEvents}
			{popEvent}
			showControls={false}
			{speed}
		/>

		<div class="relative z-10 mt-2 pb-4">
			<div class="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150"
					style:width={`${totalMoves ? (moveIndex / totalMoves) * 100 : 0}%`}
				></div>
			</div>

			<div class="flex items-center justify-center gap-2">
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-gray-100 p-3 text-gray-800 hover:bg-gray-200"
					onclick={resetReplay}
					aria-label="Restart replay"
				>
					<RotateCcwIcon size={20} />
				</button>

				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] p-3 text-white"
					onclick={togglePlay}
					aria-label={playing ? "Pause" : "Play"}
				>
					{#if playing}
						<PauseIcon size={22} />
					{:else}
						<PlayIcon size={22} />
					{/if}
				</button>

				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-gray-100 p-3 text-gray-800 hover:bg-gray-200 disabled:opacity-40"
					onclick={() => stepForward()}
					disabled={playing || atEnd || !animationIdle}
					aria-label="Step forward"
				>
					<SkipForwardIcon size={20} />
				</button>

				<button
					type="button"
					class="min-w-[3.5rem] rounded-md bg-gray-100 px-3 py-3 text-sm font-bold text-gray-800 hover:bg-gray-200"
					onclick={cycleSpeed}
					aria-label="Playback speed"
				>
					{speed}x
				</button>
			</div>
		</div>
	{/if}
</main>
