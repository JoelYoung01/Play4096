<script>
	import { page } from "$app/state";
	import Menu from "$lib/components/Menu.svelte";
	import { Game } from "$lib/game.svelte.js";
	import { gameState } from "../state.svelte.js";
	import {
		MenuIcon,
		MoveHorizontalIcon,
		MoveVerticalIcon,
		PlusIcon,
		RotateCcwIcon,
		RotateCwIcon,
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

	const GAME_OVER_DELAY = 600;
	const GAME_WIN_DELAY = 400;

	let showGameOver = $state(false);
	let showWin = $state(false);
	let openMenu = $state(false);

	$effect(() => {
		if (!game) return;

		if (game.gameOver) {
			setTimeout(() => {
				showGameOver = true;
			}, GAME_OVER_DELAY);
		}
		if (game.won && !game.canContinue) {
			setTimeout(() => {
				showWin = true;
			}, GAME_WIN_DELAY);
		}
	});

	function newGame() {
		showGameOver = false;
		showWin = false;
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
				<div class="mt-1 text-sm font-bold md:text-lg">
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
	<Menu bind:open={openMenu}>
		{#snippet activator()}
			<button class="controls-btn bg-primary hover:bg-primary-dark relative">
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
			</button>
		{/snippet}
		{#snippet content()}
			<button
				class=" bg-primary hover:bg-primary-dark flex items-center gap-2 rounded-md p-2 text-nowrap text-white"
				onclick={newGame}
			>
				<PlusIcon size={18} />
				New Game
			</button>
		{/snippet}
	</Menu>
	<div class="flex-1"></div>
	<button class="controls-btn bg-primary hover:bg-primary-dark" onclick={rotateBoard}>
		<RotateCwIcon size={18} />
	</button>
	<button class="controls-btn bg-primary hover:bg-primary-dark" onclick={rotateReverse}>
		<RotateCcwIcon size={18} />
	</button>
	<button class="controls-btn bg-primary hover:bg-primary-dark" onclick={mirrorBoardHorizontally}>
		<MoveHorizontalIcon size={18} />
	</button>
	<button class="controls-btn bg-primary hover:bg-primary-dark" onclick={mirrorBoardVertically}>
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
			<button class="overlay-btn" onclick={newGame}>Try Again</button>
		</div>
	</div>
{/if}

{#if game && showWin}
	<div class="overlay win">
		<div class="overlay-content">
			<h2>You Won!</h2>
			<p>Score: {game.score.toLocaleString()}</p>
			<button class="overlay-btn" onclick={continueGame}>Keep Playing</button>
			<button class="overlay-btn secondary" onclick={newGame}>New Game</button>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "../../../app.css";

	.controls-btn {
		@apply rounded-full p-2 text-white;
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
		background: white;
		padding: 40px;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
	}

	.overlay-content h2 {
		margin: 0 0 20px 0;
		color: #776e65;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: #776e65;
		font-size: 1.2rem;
	}

	.overlay-btn {
		background: #8f7a66;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		margin: 0 10px 10px 0;
		transition: background-color 0.2s;
	}

	.overlay-btn:hover {
		background: #7f6a56;
	}

	.overlay-btn.secondary {
		background: #bbada0;
	}

	.overlay-btn.secondary:hover {
		background: #ab9d90;
	}
</style>
