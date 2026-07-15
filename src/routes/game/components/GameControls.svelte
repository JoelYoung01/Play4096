<script>
	import { page } from "$app/state";
	import { USER_LEVELS } from "$lib/constants.js";
	import { Game } from "$lib/game.svelte.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { gameState } from "../state.svelte.js";
	import {
		BookmarkIcon,
		BookmarkPlusIcon,
		CrownIcon,
		LoaderCircleIcon,
		MenuIcon,
		MoveHorizontalIcon,
		MoveVerticalIcon,
		PlusIcon,
		RotateCcwIcon,
		RotateCwIcon,
		Undo2Icon,
		XIcon,
	} from "@lucide/svelte";
	import { cubicOut } from "svelte/easing";

	/**
	 * Custom transition that combines scale and rotation
	 * @param {HTMLElement} node
	 * @param {{ duration?: number; start?: number; delay?: number; rotateDegrees?: number }} params
	 */
	function scaleRotate(node, params = {}) {
		const { duration = 200, start = 0.8, delay = 0, rotateDegrees = 45 } = params;
		return {
			delay,
			duration,
			easing: cubicOut,
			/**
			 * @param {number} t
			 */
			css: (t) => {
				const scaleValue = start + (1 - start) * t;
				const rotate = rotateDegrees * (1 - t);
				return `transform: scale(${scaleValue}) rotate(${rotate}deg); opacity: ${t};`;
			},
		};
	}

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
	let openMenu = $state(false);
	/** True while waiting for move animations to finish before applying undo */
	let undoQueued = $state(false);
	/** True while waiting for animations before restoring a checkpoint */
	let restoreQueued = $state(false);
	let checkpointBusy = $state(false);

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

	$effect(() => {
		if (!game) return;

		if (!game.won || game.canContinue) {
			showWin = false;
		} else if (animationIdle) {
			const timeout = setTimeout(() => {
				showWin = true;
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
		undoQueued = false;
		restoreQueued = false;
		if (onNewGame) {
			void onNewGame();
			return;
		}
		gameState.hasCheckpoint = false;
		gameState.currentGame = new Game();
	}

	function continueGame() {
		if (!game) return;
		game.canContinue = true;
		showWin = false;
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
		if (!isPro || !game || checkpointBusy) return;
		openMenu = false;
		checkpointBusy = true;
		try {
			await onSetCheckpoint?.();
		} finally {
			checkpointBusy = false;
		}
	}

	async function runRestoreCheckpoint() {
		if (!isPro || !game || !gameState.hasCheckpoint || checkpointBusy) return;
		openMenu = false;
		checkpointBusy = true;
		try {
			await onRestoreCheckpoint?.();
			showGameOver = false;
			showWin = false;
		} finally {
			checkpointBusy = false;
		}
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
	<DropdownMenu.Root bind:open={openMenu}>
		<DropdownMenu.Trigger
			class="controls-btn relative bg-primary text-primary-foreground hover:bg-primary/80"
			aria-label="Game menu"
		>
			<div class="relative h-[18px] w-[18px]">
				{#if openMenu}
					<div
						class="absolute inset-0"
						in:scaleRotate={{ duration: 200, start: 0.8, delay: 100, rotateDegrees: -45 }}
						out:scaleRotate={{ duration: 150, start: 0.8, rotateDegrees: -45 }}
					>
						<XIcon size={18} />
					</div>
				{:else}
					<div
						class="absolute inset-0"
						in:scaleRotate={{ duration: 200, start: 0.8, delay: 100 }}
						out:scaleRotate={{ duration: 150, start: 0.8 }}
					>
						<MenuIcon size={18} />
					</div>
				{/if}
			</div>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Item onSelect={newGame}>
				<PlusIcon size={18} />
				New Game
			</DropdownMenu.Item>
			{#if isPro}
				<DropdownMenu.Item
					onSelect={() => void runSetCheckpoint()}
					disabled={!game || game.gameOver || checkpointBusy}
					title={game?.gameOver
						? "Checkpoints can only be set during an active game"
						: "Save a restore point for this run"}
				>
					{#if checkpointBusy}
						<LoaderCircleIcon class="animate-spin" size={18} />
					{:else}
						<BookmarkPlusIcon size={18} />
					{/if}
					Set Checkpoint
				</DropdownMenu.Item>
				<DropdownMenu.Item
					onSelect={handleRestoreCheckpoint}
					disabled={!canRestoreCheckpoint && !restoreQueued}
					title={gameState.hasCheckpoint ? "Restore to your last checkpoint" : "No checkpoint set"}
				>
					{#if restoreQueued || checkpointBusy}
						<LoaderCircleIcon class="animate-spin" size={18} />
					{:else}
						<BookmarkIcon size={18} />
					{/if}
					Restore Checkpoint
				</DropdownMenu.Item>
			{:else}
				<Button
					href={isLoggedIn ? "/stripe" : "/login"}
					variant="ghost"
					class="w-full justify-start gap-2 px-2"
					onclick={() => {
						openMenu = false;
					}}
				>
					<CrownIcon size={18} />
					Checkpoints (Pro)
				</Button>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<div class="flex-1"></div>
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
					onclick={handleRestoreCheckpoint}
					disabled={checkpointBusy || restoreQueued}
				>
					{#if restoreQueued || checkpointBusy}
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
			<p>Score: {game.score.toLocaleString()}</p>
			<Button class="m-1" onclick={continueGame}>Keep Playing</Button>
			<Button class="m-1" variant="secondary" onclick={newGame}>New Game</Button>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "../../../app.css";

	.controls-btn {
		@apply rounded-full p-2;
	}

	.cooldown-badge {
		@apply absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black/70 px-1 text-[10px] leading-none font-bold text-white;
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
		max-width: 400px;
	}

	.overlay-content h2 {
		margin: 0 0 20px 0;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: var(--muted-foreground);
		font-size: 1.2rem;
	}
</style>
