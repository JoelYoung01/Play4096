<script>
	import { untrack } from "svelte";
	import { page } from "$app/state";
	import { CHECKPOINT_COOLDOWN_MOVES, USER_LEVELS } from "$lib/constants.js";
	import { formatWinDuration } from "$lib/formatTime.js";
	import { Game } from "$lib/game.svelte.js";
	import { saveBestWinStats } from "$lib/localStorage.svelte.js";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { gameState } from "../state.svelte.js";
	import {
		BookmarkPlusIcon,
		CrownIcon,
		LoaderCircleIcon,
		MoveHorizontalIcon,
		MoveVerticalIcon,
		PlusIcon,
		RotateCcwIcon,
		RotateCwIcon,
		Undo2Icon,
	} from "@lucide/svelte";
	import BookmarkUndoIcon from "./BookmarkUndoIcon.svelte";

	let game = $derived(gameState.currentGame);
	let isPro = $derived(page.data.user?.level === USER_LEVELS.PRO);
	let isLoggedIn = $derived(!!page.data.user);

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [animationIdle]
	 * @property {(() => void) | undefined} [onUndo]
	 * @property {(() => void | Promise<void>) | undefined} [onNewGame]
	 * @property {(() => void | Promise<void>) | undefined} [onSetCheckpoint]
	 * @property {(() => void | Promise<void>) | undefined} [onRestoreCheckpoint]
	 */

	/** @type {Props} */
	let {
		animationIdle = true,
		onUndo = undefined,
		onNewGame = undefined,
		onSetCheckpoint = undefined,
		onRestoreCheckpoint = undefined,
	} = $props();

	const GAME_OVER_DELAY = 600;
	const GAME_WIN_DELAY = 400;

	let showGameOver = $state(false);
	let showWin = $state(false);
	/** Frozen wall-clock duration when the win overlay opens */
	let winElapsedMs = $state(/** @type {number | null} */ (null));
	/** Which of this win's stats are personal bests, frozen when the overlay opens */
	let winNewBest = $state({ score: false, moves: false, time: false });
	/** Confirmation dialog before ending a run in progress for a new game */
	let confirmNewGame = $state(false);
	/** Confirmation dialog before restoring the active checkpoint */
	let confirmRestoreCheckpoint = $state(false);
	/** True while waiting for move animations to finish before applying undo */
	let undoQueued = $state(false);
	/** True while waiting for animations before restoring a checkpoint */
	let restoreQueued = $state(false);
	let checkpointBusy = $state(false);
	/** Which checkpoint op is in flight, so only that button shows a spinner @type {"set" | "restore" | null} */
	let checkpointAction = $state(null);

	$effect(() => {
		if (!game) return;

		if (!game.gameOver) {
			showGameOver = false;
		} else if (animationIdle) {
			const timeout = setTimeout(() => {
				showGameOver = true;
			}, GAME_OVER_DELAY);
			return () => clearTimeout(timeout);
		}
	});

	/**
	 * Freeze this win's stats, flag the ones beating the previous bests, then
	 * fold the run into session + device bests for future comparisons.
	 */
	function captureWinStats() {
		if (!game) return;

		const score = game.score;
		const moves = game.moveCount;
		const elapsedMs =
			typeof game.createdOn === "number" ? Math.max(0, Date.now() - game.createdOn) : null;

		winElapsedMs = elapsedMs;
		winNewBest = {
			// bestScore is raised live while playing, so a new best shows up as a tie
			score: score >= gameState.bestScore,
			moves: gameState.bestWinMoves == null || moves < gameState.bestWinMoves,
			time:
				elapsedMs != null &&
				(gameState.bestWinTimeMs == null || elapsedMs < gameState.bestWinTimeMs),
		};

		if (score > gameState.bestScore) gameState.bestScore = score;
		if (winNewBest.moves) gameState.bestWinMoves = moves;
		if (winNewBest.time) gameState.bestWinTimeMs = elapsedMs;
		saveBestWinStats({ moves, timeMs: elapsedMs });
	}

	$effect(() => {
		if (!game) return;

		if (!game.won || game.canContinue) {
			showWin = false;
			winElapsedMs = null;
			winNewBest = { score: false, moves: false, time: false };
		} else if (animationIdle) {
			// Already open — moves made behind the overlay must not reset frozen stats
			if (untrack(() => showWin)) return;

			const timeout = setTimeout(() => {
				showWin = true;
				captureWinStats();
			}, GAME_WIN_DELAY);
			return () => clearTimeout(timeout);
		}
	});

	// Flush a queued undo once animations settle (or drop it if undo is no longer available)
	$effect(() => {
		if (!undoQueued) return;

		if (!game?.canUndo) {
			undoQueued = false;
			return;
		}

		if (!animationIdle) return;

		undoQueued = false;
		onUndo?.();
	});

	// Flush a queued checkpoint restore once animations settle
	$effect(() => {
		if (!restoreQueued) return;

		if (!gameState.hasCheckpoint || !isPro) {
			restoreQueued = false;
			return;
		}

		if (!animationIdle || checkpointBusy) return;

		restoreQueued = false;
		void runRestoreCheckpoint();
	});

	function newGame() {
		showGameOver = false;
		showWin = false;
		winElapsedMs = null;
		undoQueued = false;
		restoreQueued = false;
		confirmRestoreCheckpoint = false;
		if (onNewGame) {
			void onNewGame();
			return;
		}
		gameState.hasCheckpoint = false;
		gameState.checkpointMoveCount = null;
		gameState.currentGame = new Game();
	}

	/** Confirm before ending a run in progress; start right away when nothing is lost */
	function requestNewGame() {
		if (!game || game.moveCount === 0 || game.gameOver) {
			newGame();
			return;
		}
		confirmNewGame = true;
	}

	function confirmStartNewGame() {
		confirmNewGame = false;
		newGame();
	}

	function continueGame() {
		if (!game) return;
		game.canContinue = true;
		showWin = false;
		winElapsedMs = null;
	}

	function rotateBoard() {
		if (!game) return;
		game.rotateBoard(1);
	}
	function rotateReverse() {
		if (!game) return;
		game.rotateBoard(3);
	}

	function mirrorBoardHorizontally() {
		if (!game) return;
		game.mirrorBoardHorizontally();
	}

	function mirrorBoardVertically() {
		if (!game) return;
		game.mirrorBoardVertically();
	}

	function handleUndo() {
		if (!game?.canUndo || undoQueued) return;

		if (!animationIdle) {
			undoQueued = true;
			return;
		}

		onUndo?.();
	}

	async function runSetCheckpoint() {
		if (!isPro || !game || checkpointBusy || checkpointCooldownRemaining > 0) return;
		checkpointBusy = true;
		checkpointAction = "set";
		try {
			await onSetCheckpoint?.();
		} finally {
			checkpointBusy = false;
			checkpointAction = null;
		}
	}

	async function runRestoreCheckpoint() {
		if (!isPro || !game || !gameState.hasCheckpoint || checkpointBusy) return;
		checkpointBusy = true;
		checkpointAction = "restore";
		try {
			await onRestoreCheckpoint?.();
			showGameOver = false;
			showWin = false;
			winElapsedMs = null;
		} finally {
			checkpointBusy = false;
			checkpointAction = null;
		}
	}

	/** Ask before discarding progress since the checkpoint */
	function requestRestoreCheckpoint() {
		if (!isPro || !gameState.hasCheckpoint || checkpointBusy || restoreQueued) return;
		confirmRestoreCheckpoint = true;
	}

	function confirmRestoreCheckpointAction() {
		confirmRestoreCheckpoint = false;
		handleRestoreCheckpoint();
	}

	function handleRestoreCheckpoint() {
		if (!isPro || !gameState.hasCheckpoint || checkpointBusy || restoreQueued) return;

		if (!animationIdle) {
			restoreQueued = true;
			return;
		}

		void runRestoreCheckpoint();
	}

	// Only disable for real undo unavailability (cooldown / no snapshot) — not mid-animation
	let undoDisabled = $derived(!game?.canUndo);
	let undoTitle = $derived(
		!game
			? "Undo"
			: undoQueued
				? "Undoing…"
				: game.canUndo
					? "Undo last move"
					: game.undoCooldownRemaining > 0
						? `Undo available in ${game.undoCooldownRemaining} move${game.undoCooldownRemaining === 1 ? "" : "s"}`
						: "Nothing to undo"
	);

	let canRestoreCheckpoint = $derived(isPro && gameState.hasCheckpoint && !checkpointBusy);

	// Checkpoints recharge with board progress: the next one unlocks
	// CHECKPOINT_COOLDOWN_MOVES moves past the active checkpoint. Anchoring to the
	// checkpoint's move count means undo/restore can't shortcut the wait.
	let checkpointCooldownRemaining = $derived.by(() => {
		if (!game || !gameState.hasCheckpoint || gameState.checkpointMoveCount == null) return 0;
		const movesSince = game.moveCount - gameState.checkpointMoveCount;
		return Math.min(CHECKPOINT_COOLDOWN_MOVES, Math.max(0, CHECKPOINT_COOLDOWN_MOVES - movesSince));
	});

	/** How many board moves restoring the checkpoint will rewind */
	let checkpointMovesBack = $derived.by(() => {
		if (!game || gameState.checkpointMoveCount == null) return 0;
		return Math.max(0, game.moveCount - gameState.checkpointMoveCount);
	});

	let setCheckpointBusy = $derived(checkpointBusy && checkpointAction === "set");
	let restoreCheckpointBusy = $derived(
		restoreQueued || (checkpointBusy && checkpointAction === "restore")
	);

	let setCheckpointTitle = $derived(
		setCheckpointBusy
			? "Saving checkpoint…"
			: game?.gameOver
				? "Checkpoints can only be set during an active game"
				: checkpointCooldownRemaining > 0
					? `Checkpoint available in ${checkpointCooldownRemaining} move${checkpointCooldownRemaining === 1 ? "" : "s"}`
					: "Set a checkpoint for this run"
	);
	let restoreCheckpointTitle = $derived(
		restoreCheckpointBusy
			? "Restoring checkpoint…"
			: gameState.hasCheckpoint
				? checkpointMovesBack === 0
					? "Restore your last checkpoint"
					: `Restore checkpoint (${checkpointMovesBack} move${checkpointMovesBack === 1 ? "" : "s"} back)`
				: "No checkpoint set"
	);
</script>

<!-- Header -->
<div class="mb-1 flex items-start gap-2">
	<div class="flex-1/2">
		<h1 class="text-6xl font-bold sm:text-6xl">4096</h1>
		<p class="text-xs sm:text-base">Join the tiles, get to 4096!</p>
	</div>

	<div class="flex-1/2">
		<div class="flex gap-2">
			<div
				class="flex-1/2 overflow-hidden rounded-md py-2 text-center"
				style:background-color={page.data.theme?.boardBackground}
				style:color={page.data.theme?.textDark}
			>
				<div class="text-center text-sm font-bold uppercase sm:text-lg">SCORE</div>
				<div class="mt-1 text-sm font-bold sm:text-lg">
					{game?.score.toLocaleString() ?? "-"}
				</div>
			</div>
			<div
				class="flex-1/2 overflow-hidden rounded-md py-2 text-center"
				style:background-color={page.data.theme?.boardBackground}
				style:color={page.data.theme?.textDark}
			>
				<div class="text-center text-sm font-bold uppercase sm:text-lg">BEST</div>
				<div class="mt-1 text-sm font-bold sm:text-xl">
					{gameState.bestScore.toLocaleString() ?? "-"}
				</div>
			</div>
		</div>
	</div>
</div>

<div class="mb-2 flex items-center gap-1">
	<button
		class="controls-btn bg-primary text-primary-foreground hover:bg-primary/80"
		onclick={requestNewGame}
		title="New game"
		aria-label="New game"
		aria-haspopup="dialog"
	>
		<PlusIcon size={18} />
	</button>
	<div class="flex-1"></div>
	{#if isPro}
		<button
			class="controls-btn relative bg-primary text-primary-foreground hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={() => void runSetCheckpoint()}
			disabled={!game || game.gameOver || checkpointBusy || checkpointCooldownRemaining > 0}
			title={setCheckpointTitle}
			aria-label={setCheckpointTitle}
			aria-busy={setCheckpointBusy}
		>
			{#if setCheckpointBusy}
				<LoaderCircleIcon class="animate-spin" size={18} />
			{:else}
				<BookmarkPlusIcon size={18} />
			{/if}
			{#if checkpointCooldownRemaining > 0 && !setCheckpointBusy}
				<span class="cooldown-badge">{checkpointCooldownRemaining}</span>
			{/if}
		</button>
		<button
			class="controls-btn relative bg-primary text-primary-foreground hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={requestRestoreCheckpoint}
			disabled={!canRestoreCheckpoint && !restoreQueued}
			title={restoreCheckpointTitle}
			aria-label={restoreCheckpointTitle}
			aria-busy={restoreCheckpointBusy}
			aria-haspopup="dialog"
		>
			{#if restoreCheckpointBusy}
				<LoaderCircleIcon class="animate-spin" size={18} />
			{:else}
				<BookmarkUndoIcon size={18} />
			{/if}
		</button>
	{:else}
		<a
			href={isLoggedIn ? "/stripe" : "/login"}
			class="controls-btn relative flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80"
			title="Checkpoints (Pro)"
			aria-label="Checkpoints (Pro)"
		>
			<BookmarkPlusIcon size={18} />
			<span class="pro-badge"><CrownIcon size={10} /></span>
		</a>
	{/if}
	<button
		class="controls-btn relative bg-primary text-primary-foreground hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
		onclick={handleUndo}
		disabled={undoDisabled}
		title={undoTitle}
		aria-label={undoTitle}
		aria-busy={undoQueued}
	>
		{#if undoQueued}
			<LoaderCircleIcon class="animate-spin" size={18} />
		{:else}
			<Undo2Icon size={18} />
		{/if}
		{#if game && game.undoCooldownRemaining > 0 && !undoQueued}
			<span class="cooldown-badge">{game.undoCooldownRemaining}</span>
		{/if}
	</button>
	<button
		class="controls-btn bg-primary text-primary-foreground hover:bg-primary/80"
		onclick={rotateBoard}
	>
		<RotateCwIcon size={18} />
	</button>
	<button
		class="controls-btn bg-primary text-primary-foreground hover:bg-primary/80"
		onclick={rotateReverse}
	>
		<RotateCcwIcon size={18} />
	</button>
	<button
		class="controls-btn bg-primary text-primary-foreground hover:bg-primary/80"
		onclick={mirrorBoardHorizontally}
	>
		<MoveHorizontalIcon size={18} />
	</button>
	<button
		class="controls-btn bg-primary text-primary-foreground hover:bg-primary/80"
		onclick={mirrorBoardVertically}
	>
		<MoveVerticalIcon size={18} />
	</button>
</div>

<!-- Game Control Buttons -->

<!-- Game Overlay -->
{#if game && showGameOver}
	<div class="overlay game-over">
		<div class="overlay-content">
			<h2>Game Over!</h2>
			<p>Final Score: {game.score.toLocaleString()}</p>
			{#if game.canUndo}
				<Button class="m-1" onclick={handleUndo}>Undo Last Move</Button>
			{/if}
			{#if isPro && gameState.hasCheckpoint}
				<Button
					class="m-1"
					variant={game.canUndo ? "secondary" : "default"}
					onclick={requestRestoreCheckpoint}
					disabled={checkpointBusy || restoreQueued}
					aria-haspopup="dialog"
				>
					{#if restoreCheckpointBusy}
						Restoring…
					{:else}
						Restore Checkpoint
					{/if}
				</Button>
			{:else if !isPro}
				<Button href={isLoggedIn ? "/stripe" : "/login"} class="m-1" variant="secondary">
					Checkpoints (Pro)
				</Button>
			{/if}
			<Button
				class="m-1"
				variant={game.canUndo || (isPro && gameState.hasCheckpoint) || !isPro
					? "secondary"
					: "default"}
				onclick={newGame}
			>
				Try Again
			</Button>
		</div>
	</div>
{/if}

{#if game && showWin}
	<div class="overlay win">
		<div class="overlay-content">
			<h2>You Won!</h2>
			<div class="win-stats" role="group" aria-label="Game stats">
				<div
					class="win-stat"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					{#if winNewBest.score}
						<span class="win-stat-badge">New Best!</span>
					{/if}
					<span class="win-stat-label">Score</span>
					<span class="win-stat-value">{game.score.toLocaleString()}</span>
				</div>
				<div
					class="win-stat"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					{#if winNewBest.moves}
						<span class="win-stat-badge">New Best!</span>
					{/if}
					<span class="win-stat-label">Moves</span>
					<span class="win-stat-value">{game.moveCount.toLocaleString()}</span>
				</div>
				<div
					class="win-stat"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					{#if winNewBest.time}
						<span class="win-stat-badge">New Best!</span>
					{/if}
					<span class="win-stat-label">Time</span>
					<span class="win-stat-value">{formatWinDuration(winElapsedMs)}</span>
				</div>
			</div>
			<Button class="m-1" onclick={continueGame}>Keep Playing</Button>
			<Button class="m-1" variant="secondary" onclick={newGame}>New Game</Button>
		</div>
	</div>
{/if}

<AlertDialog.Root bind:open={confirmNewGame}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Start a new game?</AlertDialog.Title>
			<AlertDialog.Description>
				This ends your current run{game ? ` at ${game.score.toLocaleString()} points` : ""} and starts
				a fresh board.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmStartNewGame}>New Game</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={confirmRestoreCheckpoint}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Restore checkpoint?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if checkpointMovesBack === 0}
					This restores your board to the saved checkpoint.
				{:else}
					This goes back {checkpointMovesBack.toLocaleString()} move{checkpointMovesBack === 1
						? ""
						: "s"} and restores your board to the saved checkpoint.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmRestoreCheckpointAction}>Restore</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style lang="postcss">
	@reference "../../../app.css";

	.controls-btn {
		@apply rounded-full p-2;
	}

	.cooldown-badge {
		@apply absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black/70 px-1 text-[10px] leading-none font-bold text-white;
	}

	.pro-badge {
		@apply absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950;
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
		background: var(--popover);
		color: var(--popover-foreground);
		padding: 40px;
		border-radius: 12px;
		text-align: center;
		max-width: 420px;
		width: calc(100% - 2rem);
	}

	.overlay-content h2 {
		margin: 0 0 12px 0;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: var(--muted-foreground);
		font-size: 1.2rem;
	}

	.win-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
		margin: 1.25rem 0 1.5rem;
	}

	.win-stat {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		padding: 0.65rem 0.5rem;
		border-radius: 0.5rem;
		min-width: 0;
	}

	.win-stat-badge {
		position: absolute;
		top: -0.55rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.16rem 0.45rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		color: #451a03;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
		animation: win-badge-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 250ms both;
	}

	@keyframes win-badge-pop {
		from {
			opacity: 0;
			transform: translateX(-50%) scale(0.5);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.win-stat-badge {
			animation: none;
		}
	}

	.win-stat-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.win-stat-value {
		font-size: 1.15rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
</style>
