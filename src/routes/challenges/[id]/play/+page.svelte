<script>
	import { browser } from "$app/environment";
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { Game, getTileBackground, getTileColor } from "$lib/game.svelte.js";
	import { DIRECTIONS } from "$lib/constants.js";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		countFilledCells,
		evaluateChallenge,
		resolveClearTarget,
	} from "$lib/challenges.js";
	import Btn from "$lib/components/Btn.svelte";

	let { data } = $props();

	const TOUCH_THRESHOLD = 5;

	/** @type {Game | null} */
	let game = $state(null);
	let result = $state(/** @type {'won' | 'lost' | null} */ (null));
	let remainingMs = $state(0);
	let submitting = $state(false);

	/** @type {HTMLFormElement | null} */
	let completeForm = $state(null);

	const challenge = $derived(data.challenge);
	const isTime = $derived(challenge.type === CHALLENGE_TYPES.TIME);
	const isClear = $derived(challenge.type === CHALLENGE_TYPES.CLEAR);

	const clearTarget = $derived(
		isClear ? resolveClearTarget(/** @type {any} */ (challenge.params)) : null
	);

	const filledCells = $derived(game ? countFilledCells(game.board) : 0);

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

	function initGame() {
		if (!browser) return;
		game = createChallengeGame();
		result = null;

		if (isTime) {
			const durationMs = challenge.params.durationSec * 1000;
			const elapsed = Date.now() - data.run.startedOn;
			remainingMs = Math.max(0, durationMs - elapsed);
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

	function checkOutcome() {
		if (!game || result) return;

		const elapsedMs = isTime ? Date.now() - data.run.startedOn : undefined;
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
	 * @param {number} direction
	 */
	function handleMove(direction) {
		if (!game || result) return;
		const events = game.moveTiles(direction);
		if (events.length > 0) {
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

	let touchStartX = 0;
	let touchStartY = 0;

	/** @param {TouchEvent} event */
	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	/** @param {TouchEvent} event */
	function handleTouchEnd(event) {
		if (!touchStartX || !touchStartY) return;
		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;
		const diffX = touchStartX - touchEndX;
		const diffY = touchStartY - touchEndY;
		if (Math.abs(diffX) < TOUCH_THRESHOLD && Math.abs(diffY) < TOUCH_THRESHOLD) return;
		event.preventDefault();
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

	/** @param {TouchEvent} event */
	function handleTouchMove(event) {
		event.preventDefault();
	}

	onMount(() => {
		if (data.run.status !== CHALLENGE_RUN_STATUS.IN_PROGRESS) {
			result = data.run.status === CHALLENGE_RUN_STATUS.WON ? "won" : "lost";
			return;
		}

		initGame();
		checkOutcome();

		window.addEventListener("keydown", handleKeydown);

		/** @type {ReturnType<typeof setInterval> | null} */
		let timer = null;
		if (isTime) {
			timer = setInterval(() => {
				const durationMs = challenge.params.durationSec * 1000;
				remainingMs = Math.max(0, durationMs - (Date.now() - data.run.startedOn));
				checkOutcome();
			}, 200);
		}

		return () => {
			window.removeEventListener("keydown", handleKeydown);
			if (timer) clearInterval(timer);
		};
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
	<input type="hidden" name="score" value={game?.score ?? 0} />
	<input
		type="hidden"
		name="metrics"
		value={JSON.stringify({
			moveCount: game?.moveCount ?? 0,
			filledCells: game ? countFilledCells(game.board) : 0,
			elapsedMs: isTime ? Date.now() - data.run.startedOn : undefined,
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
			<p class="text-xs font-bold tracking-wide text-gray-500 uppercase">Challenge</p>
			<h1 class="text-2xl font-bold text-[var(--color-primary)]">{challenge.title}</h1>
			<p class="text-sm text-gray-500">{data.objective}</p>
		</div>
		<div class="flex gap-2">
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
			{:else if isClear}
				<div
					class="min-w-[4.5rem] rounded-md px-3 py-2 text-center"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					<div class="text-xs font-bold uppercase">Tiles</div>
					<div class="font-bold">{filledCells}/{clearTarget}</div>
				</div>
			{/if}
		</div>
	</div>

	{#if game}
		<div
			class="mb-4 grid aspect-square grid-cols-4 gap-2.5 rounded-lg p-2.5"
			style:background-color={page.data.theme?.boardBackground}
		>
			{#each game.board as row, ri (ri)}
				{#each row as cell, ci (`${ri}-${ci}`)}
					<div
						class="flex items-center justify-center rounded-md text-xl font-extrabold sm:text-2xl"
						style:background-color={cell
							? getTileBackground(cell, page.data.theme)
							: page.data.theme?.emptyTile}
						style:color={cell ? getTileColor(cell, page.data.theme) : "transparent"}
					>
						{cell || ""}
					</div>
				{/each}
			{/each}
		</div>
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
				{:else if isTime && game && game.score < challenge.params.targetScore}
					Time's up (or game over) with {game.score.toLocaleString()} points.
				{:else}
					Game over before the objective was met.
				{/if}
			</p>
			<p class="mb-4 text-sm text-gray-500">Score: {game?.score.toLocaleString() ?? 0}</p>
			<div class="flex flex-wrap justify-center gap-2">
				<form method="POST" action="/challenges/{challenge.id}?/start" use:enhance>
					<Btn type="submit" class="justify-center">Retry</Btn>
				</form>
				<Btn href="/challenges" class="justify-center">All Challenges</Btn>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.challenge-play {
		max-width: 500px;
		min-height: 100vh;
		margin: 0 auto;
		padding: 20px;
		padding-bottom: 5rem;
		user-select: none;
		touch-action: manipulation;
		overscroll-behavior: contain;
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
