<script>
	import { applyAction, enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { untrack } from "svelte";
	import { page } from "$app/state";
	import { contrastRatio, getInkColor } from "$lib/assets/themes.js";
	import { Game } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { createSwipeHandlers } from "$lib/swipe.js";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		countFilledCells,
		evaluateChallenge,
		formatChallengeElapsedMs,
	} from "$lib/challenges.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import GameStats from "$lib/components/GameStats.svelte";
	import AnimatedBoard from "../../../game/components/AnimatedBoard.svelte";
	import { RotateCcwIcon } from "@lucide/svelte";

	/** Pause on the stuck board after animations so the loss is readable before the overlay. */
	const GAME_OVER_DELAY_MS = 1000;

	let { data } = $props();

	/** @type {Game | null} */
	let game = $state(null);
	let result = $state(/** @type {'won' | 'lost' | null} */ (null));
	/** Set when a loss is detected; overlay waits for animations + GAME_OVER_DELAY_MS. */
	let pendingLoss = $state(false);
	let remainingMs = $state(0);
	/** Elapsed ms captured when the run finishes. */
	let finishedElapsedMs = $state(/** @type {number | null} */ (null));
	let submitting = $state(false);
	let retrying = $state(false);
	/** Bound from AnimatedBoard — true when move animations have settled. */
	let animationIdle = $state(true);

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);

	/** @type {HTMLFormElement | null} */
	let completeForm = $state(null);

	const challenge = $derived(data.challenge);
	const isTime = $derived(challenge.type === CHALLENGE_TYPES.TIME);
	const isRecovery = $derived(challenge.type === CHALLENGE_TYPES.RECOVERY);

	const theme = $derived(page.data.theme);
	// Readable ink for the board-colored stat boxes
	const boardInk = $derived(theme ? getInkColor(theme.boardBackground, theme) : "#f9f6f2");
	// Urgent countdown red: keep the historical deep red unless the theme's
	// destructive accent reads better on the board (dark boards need it)
	const urgentInk = $derived.by(() => {
		const fallback = "#b91c1c";
		if (!theme) return fallback;
		const themed = theme.destructive ?? fallback;
		return contrastRatio(theme.boardBackground, themed) >
			contrastRatio(theme.boardBackground, fallback)
			? themed
			: fallback;
	});

	const winTile = $derived(
		isRecovery && "winTile" in challenge.params ? challenge.params.winTile : null
	);

	/**
	 * Build a Game from challenge params.
	 * @returns {Game}
	 */
	function createChallengeGame() {
		const params = challenge.params;
		const seed = "seed" in params ? params.seed : undefined;
		const winTile =
			challenge.type === CHALLENGE_TYPES.RECOVERY && "winTile" in params
				? params.winTile
				: undefined;

		if ("board" in params && params.board) {
			return new Game({
				seed,
				winTile,
				initialState: {
					board: params.board.map((row) => [...row]),
					score: 0,
					seed,
					moveCount: 0,
					undoCooldownRemaining: 0,
				},
			});
		}

		return new Game({ seed, winTile });
	}

	/**
	 * @param {number} startedOn
	 */
	function initGame(startedOn) {
		pendingEvents = [];
		game = createChallengeGame();
		result = null;
		pendingLoss = false;
		finishedElapsedMs = null;
		submitting = false;
		retrying = false;
		animationIdle = true;

		if (isTime && "durationSec" in challenge.params) {
			const durationMs = challenge.params.durationSec * 1000;
			remainingMs = Math.max(0, durationMs - (Date.now() - startedOn));
		}
	}

	/**
	 * @param {number} ms
	 */
	function formatTime(ms) {
		const totalSec = Math.max(0, Math.ceil(ms / 1000));
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	/**
	 * @param {'won' | 'lost'} status
	 */
	function finish(status) {
		if (result || submitting || data.run.status !== CHALLENGE_RUN_STATUS.IN_PROGRESS) return;
		pendingLoss = false;
		result = status;
		if (finishedElapsedMs == null) {
			finishedElapsedMs = Math.max(0, Date.now() - data.run.startedOn);
		}
		submitting = true;
		queueMicrotask(() => completeForm?.requestSubmit());
	}

	/**
	 * @param {number} [startedOn]
	 */
	function checkOutcome(startedOn = data.run.startedOn) {
		if (!game || result || pendingLoss) return;

		const elapsedMs = isTime ? Date.now() - startedOn : undefined;
		const outcome = evaluateChallenge(challenge, {
			board: game.board,
			score: game.score,
			gameOver: game.gameOver,
			won: game.won,
			elapsedMs,
		});

		if (outcome === "won") {
			finish("won");
		} else if (outcome === "lost") {
			// Hold the fail overlay so the stuck / timed-out board can register.
			// Freeze elapsed now so the delay doesn't inflate time-challenge stats.
			finishedElapsedMs = Math.max(0, Date.now() - data.run.startedOn);
			pendingLoss = true;
		}
	}

	/**
	 * @returns {import("$lib/types").GameEvent | undefined}
	 */
	function popEvent() {
		return pendingEvents.shift();
	}

	/**
	 * @param {number} direction
	 */
	function handleMove(direction) {
		if (!game || result || pendingLoss) return;
		const events = game.moveTiles(direction);
		if (events.length > 0) {
			pendingEvents.push(...events);
			checkOutcome();
		}
	}

	/**
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

	// Re-init when Retry starts a new run on the same play route (no remount).
	$effect(() => {
		const runId = data.run.id;
		const status = data.run.status;
		const startedOn = data.run.startedOn;
		void runId;

		if (status !== CHALLENGE_RUN_STATUS.IN_PROGRESS) {
			result = status === CHALLENGE_RUN_STATUS.WON ? "won" : "lost";
			const metrics = data.run.metrics;
			if (metrics && typeof metrics === "object") {
				const elapsed = /** @type {{ elapsedMs?: unknown }} */ (metrics).elapsedMs;
				finishedElapsedMs =
					typeof elapsed === "number" && Number.isFinite(elapsed) ? elapsed : null;
			}
			return;
		}

		const timed = untrack(() => isTime);
		const durationSec = untrack(() =>
			"durationSec" in challenge.params ? challenge.params.durationSec : null
		);
		untrack(() => {
			initGame(startedOn);
			checkOutcome(startedOn);
		});

		window.addEventListener("keydown", handleKeydown);

		/** @type {ReturnType<typeof setInterval> | null} */
		let timer = null;
		if (timed && durationSec != null) {
			const durationMs = durationSec * 1000;
			timer = setInterval(() => {
				remainingMs = Math.max(0, durationMs - (Date.now() - startedOn));
				checkOutcome(startedOn);
			}, 200);
		}

		return () => {
			window.removeEventListener("keydown", handleKeydown);
			if (timer) clearInterval(timer);
		};
	});

	/** @type {import("@sveltejs/kit").SubmitFunction} */
	const onReset = () => {
		// Cancel a pending fail overlay / complete submit if the player resets first.
		pendingLoss = false;
		retrying = true;
		return async ({ result: actionResult }) => {
			if (actionResult.type === "redirect") {
				await goto(actionResult.location);
				return;
			}
			retrying = false;
			await applyAction(actionResult);
		};
	};

	// After the last move animates, pause briefly on the stuck board, then fail.
	$effect(() => {
		if (!pendingLoss || !animationIdle || result) return;
		const timeout = setTimeout(() => finish("lost"), GAME_OVER_DELAY_MS);
		return () => clearTimeout(timeout);
	});

	/**
	 * @param {unknown} value
	 * @returns {number | null}
	 */
	function asFiniteNumber(value) {
		return typeof value === "number" && Number.isFinite(value) ? value : null;
	}

	/** Stored metrics fallback for finished runs viewed after a reload (no live game). */
	const runMetrics = $derived(
		/** @type {{ moveCount?: unknown, mergeScore?: unknown, elapsedMs?: unknown }} */ (
			data.run.metrics ?? {}
		)
	);

	/** Stat cards for the result dialog, ranked metric first. */
	let resultStats = $derived.by(() => {
		const statMoves = game?.moveCount ?? asFiniteNumber(runMetrics.moveCount);
		const statScore = game?.score ?? asFiniteNumber(runMetrics.mergeScore);

		const moves = { label: "Moves", value: statMoves?.toLocaleString() ?? "—" };
		const score = { label: "Score", value: statScore?.toLocaleString() ?? "—" };
		const time = { label: "Time", value: formatChallengeElapsedMs(finishedElapsedMs) };

		if (isRecovery) return [moves, score, time];
		if (isTime) return [time, score, moves];
		return [score, moves, time];
	});
</script>

<svelte:head>
	<title>{challenge.title} - Play - 4096</title>
</svelte:head>

<form
	bind:this={completeForm}
	method="POST"
	action="?/complete"
	class="hidden"
	use:enhance={() => {
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<input type="hidden" name="runId" value={data.run.id} />
	<input
		type="hidden"
		name="status"
		value={result === "won" ? CHALLENGE_RUN_STATUS.WON : CHALLENGE_RUN_STATUS.LOST}
	/>
	<input
		type="hidden"
		name="score"
		value={isRecovery
			? (game?.moveCount ?? 0)
			: isTime
				? (finishedElapsedMs ?? Math.max(0, Date.now() - data.run.startedOn))
				: (game?.score ?? 0)}
	/>
	<input
		type="hidden"
		name="metrics"
		value={JSON.stringify({
			moveCount: game?.moveCount ?? 0,
			filledCells: game ? countFilledCells(game.board) : 0,
			elapsedMs: finishedElapsedMs ?? Math.max(0, Date.now() - data.run.startedOn),
			mergeScore: game?.score ?? 0,
		})}
	/>
</form>

<div
	class="challenge-play"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<div class="mb-3 flex items-start gap-2">
		<div class="flex-1">
			<p class="text-xs font-bold tracking-wide text-muted-foreground uppercase">Daily Challenge</p>
			<h1 class="text-2xl font-bold text-primary">{challenge.title}</h1>
			<p class="text-sm text-muted-foreground">{data.objective}</p>
		</div>
		<div class="flex gap-2">
			{#if isRecovery}
				<div
					class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
					style:background-color={theme?.boardBackground}
					style:color={boardInk}
				>
					<div class="text-xs font-bold uppercase">Moves</div>
					<div class="font-bold">{game?.moveCount ?? 0}</div>
				</div>
				{#if winTile}
					<div
						class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
						style:background-color={theme?.boardBackground}
						style:color={boardInk}
					>
						<div class="text-xs font-bold uppercase">Goal</div>
						<div class="font-bold">{winTile}</div>
					</div>
				{/if}
			{:else}
				<div
					class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
					style:background-color={theme?.boardBackground}
					style:color={boardInk}
				>
					<div class="text-xs font-bold uppercase">Score</div>
					<div class="font-bold">{game?.score.toLocaleString() ?? "—"}</div>
				</div>
				{#if isTime}
					<div
						class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
						style:background-color={theme?.boardBackground}
						style:color={remainingMs <= 10000 ? urgentInk : boardInk}
					>
						<div class="text-xs font-bold uppercase">Time</div>
						<div class="font-bold">{formatTime(remainingMs)}</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	{#if game}
		<AnimatedBoard
			{game}
			{pendingEvents}
			{popEvent}
			showControls={false}
			bind:animationIdle
		/>
	{:else}
		<div
			class="mb-4 flex aspect-square items-center justify-center rounded-lg"
			style:background-color={theme?.boardBackground}
		>
			Loading…
		</div>
	{/if}

	<div class="mt-3 flex flex-wrap items-center justify-center gap-2">
		<form method="POST" action="?/start" use:enhance={onReset}>
			<Button
				type="submit"
				variant="secondary"
				class="justify-center gap-1.5"
				disabled={retrying || submitting || data.run.status !== CHALLENGE_RUN_STATUS.IN_PROGRESS}
			>
				<RotateCcwIcon size={16} />
				{retrying ? "Resetting…" : "Reset"}
			</Button>
		</form>
		<a
			href="/challenges/{challenge.id}"
			class="text-sm text-primary hover:underline"
		>
			Abandon & back
		</a>
	</div>

	<p class="mt-3 text-center text-sm text-muted-foreground">
		Arrow keys or swipe to move. Challenge progress is saved when you finish.
	</p>
</div>

{#if result}
	<div class="overlay">
		<div class="overlay-content">
			<h2>{result === "won" ? "Challenge Cleared!" : "Challenge Failed"}</h2>
			<p>
				{#if result === "won"}
					Nice work — {data.objective.toLowerCase()}.
				{:else if isTime}
					Time's up (or game over) before reaching the target score.
				{:else}
					Game over before the objective was met.
				{/if}
			</p>
			<GameStats stats={resultStats} label="Challenge stats" />
			<div class="flex flex-wrap justify-center gap-2">
				<form method="POST" action="?/start" use:enhance={onReset}>
					<Button type="submit" class="justify-center gap-1.5" disabled={retrying || submitting}>
						<RotateCcwIcon size={16} />
						{retrying ? "Starting…" : "Retry"}
					</Button>
				</form>
				<Button href="/challenges" class="justify-center" variant="secondary">Calendar</Button>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.challenge-play {
		max-width: 500px;
		min-height: 100%;
		margin: 0 auto;
		padding: 20px;
		padding-bottom: 5rem;
		color: var(--foreground);
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.overlay-content {
		background: var(--popover);
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
		width: 100%;
		color: var(--popover-foreground);
	}

	.overlay-content h2 {
		margin: 0 0 0.75rem;
		font-size: 1.75rem;
	}

	.overlay-content p {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
	}
</style>
