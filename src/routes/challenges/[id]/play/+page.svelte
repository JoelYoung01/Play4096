<script>
	import { applyAction, enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { untrack } from "svelte";
	import { page } from "$app/state";
	import { Game } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import { createSwipeHandlers } from "$lib/swipe.js";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		countFilledCells,
		evaluateChallenge,
	} from "$lib/challenges.js";
	import Btn from "$lib/components/Btn.svelte";
	import AnimatedBoard from "../../../game/components/AnimatedBoard.svelte";

	let { data } = $props();

	/** @type {Game | null} */
	let game = $state(null);
	let result = $state(/** @type {'won' | 'lost' | null} */ (null));
	let remainingMs = $state(0);
	let submitting = $state(false);
	let retrying = $state(false);

	/** @type {import("$lib/types").GameEvent[]} */
	let pendingEvents = $state([]);

	/** @type {HTMLFormElement | null} */
	let completeForm = $state(null);

	const challenge = $derived(data.challenge);
	const isTime = $derived(challenge.type === CHALLENGE_TYPES.TIME);
	const isRecovery = $derived(challenge.type === CHALLENGE_TYPES.RECOVERY);

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
		submitting = false;
		retrying = false;

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
		result = status;
		submitting = true;
		queueMicrotask(() => completeForm?.requestSubmit());
	}

	/**
	 * @param {number} [startedOn]
	 */
	function checkOutcome(startedOn = data.run.startedOn) {
		if (!game || result) return;

		const elapsedMs = isTime ? Date.now() - startedOn : undefined;
		const outcome = evaluateChallenge(challenge, {
			board: game.board,
			score: game.score,
			gameOver: game.gameOver,
			won: game.won,
			elapsedMs,
		});

		if (outcome === "won" || outcome === "lost") {
			finish(outcome);
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
		if (!game || result) return;
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
	const onRetry = () => {
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
		value={isRecovery ? (game?.moveCount ?? 0) : (game?.score ?? 0)}
	/>
	<input
		type="hidden"
		name="metrics"
		value={JSON.stringify({
			moveCount: game?.moveCount ?? 0,
			filledCells: game ? countFilledCells(game.board) : 0,
			elapsedMs: isTime ? Date.now() - data.run.startedOn : undefined,
			mergeScore: isRecovery ? (game?.score ?? 0) : undefined,
		})}
	/>
</form>

<div
	class="challenge-play"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	style:color={page.data.theme?.text}
>
	<div class="mb-3 flex items-start gap-2">
		<div class="flex-1">
			<p class="text-xs font-bold tracking-wide text-gray-500 uppercase">Daily Challenge</p>
			<h1 class="text-2xl font-bold text-[var(--color-primary)]">{challenge.title}</h1>
			<p class="text-sm text-gray-500">{data.objective}</p>
		</div>
		<div class="flex gap-2">
			{#if isRecovery}
				<div
					class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					<div class="text-xs font-bold uppercase">Moves</div>
					<div class="font-bold">{game?.moveCount ?? 0}</div>
				</div>
				{#if winTile}
					<div
						class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
						style:background-color={page.data.theme?.boardBackground}
						style:color={page.data.theme?.textDark}
					>
						<div class="text-xs font-bold uppercase">Goal</div>
						<div class="font-bold">{winTile}</div>
					</div>
				{/if}
			{:else}
				<div
					class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					<div class="text-xs font-bold uppercase">Score</div>
					<div class="font-bold">{game?.score.toLocaleString() ?? "—"}</div>
				</div>
				{#if isTime}
					<div
						class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
						style:background-color={page.data.theme?.boardBackground}
						style:color={remainingMs <= 10000 ? "#b91c1c" : page.data.theme?.textDark}
					>
						<div class="text-xs font-bold uppercase">Time</div>
						<div class="font-bold">{formatTime(remainingMs)}</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	{#if game}
		<AnimatedBoard {game} {pendingEvents} {popEvent} showControls={false} />
	{:else}
		<div
			class="mb-4 flex aspect-square items-center justify-center rounded-lg"
			style:background-color={page.data.theme?.boardBackground}
		>
			Loading…
		</div>
	{/if}

	<p class="text-center text-sm text-gray-500">
		Arrow keys or swipe to move. Challenge progress is saved when you finish.
	</p>

	<p class="mt-3 text-center text-sm">
		<a href="/challenges/{challenge.id}" class="text-[var(--color-primary)] hover:underline">
			Abandon & back
		</a>
	</p>
</div>

{#if result}
	<div class="overlay">
		<div class="overlay-content">
			<h2>{result === "won" ? "Challenge Cleared!" : "Challenge Failed"}</h2>
			<p>
				{#if result === "won"}
					Nice work — {data.objective.toLowerCase()}.
				{:else if isTime && game && "targetScore" in challenge.params && game.score < challenge.params.targetScore}
					Time's up (or game over) with {game.score.toLocaleString()} points.
				{:else}
					Game over before the objective was met.
				{/if}
			</p>
			<p class="mb-4 text-sm text-gray-500">
				{#if isRecovery}
					Moves: {game?.moveCount ?? 0}
				{:else}
					Score: {game?.score.toLocaleString() ?? 0}
				{/if}
			</p>
			<div class="flex flex-wrap justify-center gap-2">
				<form method="POST" action="?/start" use:enhance={onRetry}>
					<Btn type="submit" class="justify-center" disabled={retrying || submitting}>
						{retrying ? "Starting…" : "Retry"}
					</Btn>
				</form>
				<Btn href="/challenges" class="justify-center">Calendar</Btn>
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
		background: white;
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
		width: 100%;
		color: #776e65;
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
