<script>
	import { browser } from "$app/environment";
	import { Game } from "$lib/game.svelte.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
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
	 * Apply the next recorded action (slide or board transform) and queue animation events
	 * @returns {boolean} Whether a move was applied
	 */
	function stepForward() {
		if (!replayGame || atEnd || pendingEvents.length > 0 || !animationIdle) return false;

		const action = data.replay.moves[moveIndex];
		const events = replayGame.applyRecordedAction(action);
		if (events.length === 0) {
			// Corrupted / desynced / unknown action — stop playback
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
	<meta name="description" content="Watch a move-by-move replay of a 4096 game." />
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 pt-6 pb-28 text-foreground">
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<Button href="/replay" variant="ghost" size="sm" class="gap-1">
			<ChevronLeftIcon size={16} />
			History
		</Button>
		<span class="text-sm text-muted-foreground">·</span>
		{#if data.replay.status === "active"}
			<Badge variant="outline">Active</Badge>
			{#if data.replay.won}
				<Badge variant="secondary">Won</Badge>
			{/if}
		{:else}
			<Badge variant={data.replay.won ? "secondary" : "destructive"}>
				{data.replay.won ? "Win" : "Loss"}
			</Badge>
		{/if}
		<span class="text-sm font-semibold text-foreground">
			{data.replay.score.toLocaleString()} pts
		</span>
		{#if data.replay.status === "active"}
			<Button href="/game" variant="secondary" size="sm" class="ms-auto">Continue</Button>
		{/if}
	</div>
	{#if data.replay.status === "active"}
		<p class="mb-3 text-xs text-muted-foreground">
			In-progress replay — playback covers moves recorded so far.
		</p>
	{/if}

	{#if replayGame}
		<div class="mb-2 flex items-center justify-between text-sm text-muted-foreground">
			<span
				>Score: <strong class="text-foreground">{replayGame.score.toLocaleString()}</strong></span
			>
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
			<div class="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-[width] duration-150"
					style:width={`${totalMoves ? (moveIndex / totalMoves) * 100 : 0}%`}
				></div>
			</div>

			<div class="flex items-center justify-center gap-2">
				<Button
					variant="secondary"
					size="icon-lg"
					onclick={resetReplay}
					aria-label="Restart replay"
				>
					<RotateCcwIcon size={20} />
				</Button>

				<Button size="icon-lg" onclick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
					{#if playing}
						<PauseIcon size={22} />
					{:else}
						<PlayIcon size={22} />
					{/if}
				</Button>

				<Button
					variant="secondary"
					size="icon-lg"
					onclick={() => stepForward()}
					disabled={playing || atEnd || !animationIdle}
					aria-label="Step forward"
				>
					<SkipForwardIcon size={20} />
				</Button>

				<Button
					variant="secondary"
					size="icon-lg"
					class="min-w-[3.5rem] text-sm font-bold"
					onclick={cycleSpeed}
					aria-label="Playback speed"
				>
					{speed}x
				</Button>
			</div>
		</div>
	{/if}
</main>
