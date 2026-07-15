<script>
	import { onDestroy } from "svelte";
	import { page } from "$app/state";
	import { getTileBackground, getTileColor } from "$lib/game.svelte.js";
	import { defaultTheme } from "$lib/assets/themes.js";
	import { TileAnimator } from "$lib/tileAnimator.js";

	import GameControls from "./GameControls.svelte";
	import { gameState } from "../state.svelte.js";
	import {
		BOARD_GAP as GAP,
		BOARD_PADDING as PADDING,
		TILE_BORDER_RADIUS,
		BOARD_BORDER_RADIUS,
	} from "$lib/boardConstants.js";

	/**
	 * @type {{
	 *   pendingEvents?: import("$lib/types").GameEvent[],
	 *   popEvent: () => import("$lib/types").GameEvent | undefined,
	 *   onUndo?: () => void,
	 *   onNewGame?: () => void | Promise<void>,
	 *   onSetCheckpoint?: () => void | Promise<void>,
	 *   onRestoreCheckpoint?: () => void | Promise<void>,
	 *   game?: import("$lib/game.svelte.js").Game | null,
	 *   showControls?: boolean,
	 *   speed?: number,
	 *   animationIdle?: boolean,
	 * }}
	 */
	let {
		pendingEvents = [],
		popEvent,
		onUndo = undefined,
		onNewGame = undefined,
		onSetCheckpoint = undefined,
		onRestoreCheckpoint = undefined,
		game: gameProp = undefined,
		showControls = true,
		speed = 1,
		animationIdle = $bindable(true),
	} = $props();

	let game = $derived(gameProp !== undefined ? gameProp : gameState.currentGame);
	let theme = $derived(page.data.theme || defaultTheme);

	/** @type {HTMLDivElement | null} */
	let boardContainer = $state(null);
	let cellSize = $state(0);
	let animating = $state(false);
	let frame = $state(0);

	const animator = new TileAnimator({
		onAnimatingChange: (value) => {
			animating = value;
		},
		onFrame: () => {
			frame += 1;
		},
		speed,
	});

	$effect(() => {
		animator.setSpeed(speed);
	});

	$effect(() => {
		animationIdle = !animating && pendingEvents.length === 0;
	});

	let renderTiles = $derived.by(() => {
		frame;
		return animator.tiles;
	});

	/**
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileFontSize(value) {
		const mobile = typeof window !== "undefined" && window.innerWidth <= 600;
		const baseSize = mobile ? 2.5 : theme.textScale;
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}

	/**
	 * @param {import("$lib/types").VisualTile} tile
	 */
	function tileStyle(tile) {
		void frame;
		const offset = cellSize + GAP;
		return `
			width: ${cellSize}px;
			height: ${cellSize}px;
			transform: translate(${PADDING + tile.currentPos.x * offset}px, ${PADDING + tile.currentPos.y * offset}px) scale(${tile.scale});
			opacity: ${tile.alpha};
			background: ${getTileBackground(tile.value, theme)};
			color: ${getTileColor(tile.value, theme)};
			border-radius: ${TILE_BORDER_RADIUS}px;
			font-size: ${getTileFontSize(tile.value)};
		`;
	}

	function drainPendingEvents() {
		animating = true;

		while (pendingEvents.length > 0) {
			const event = popEvent();
			if (!event) break;
			animator.processEvent(event);
		}

		if (game) {
			boardSignature = JSON.stringify(game.board);
		}

		animator.processEvents([]);
	}

	// Watch for new pending events
	$effect(() => {
		if (pendingEvents.length === 0) return;
		drainPendingEvents();
	});

	/** @type {import("$lib/game.svelte.js").Game | null} */
	let syncedGame = null;
	let boardSignature = $state("");

	// Initialize or reset when a different game instance is loaded
	$effect(() => {
		if (!game) return;

		if (game !== syncedGame) {
			syncedGame = game;
			animator.syncFromBoard(game.board);
			boardSignature = JSON.stringify(game.board);
		}
	});

	// Sync after cheat transforms (rotate/mirror) when idle
	$effect(() => {
		if (!game || animating || pendingEvents.length > 0) return;

		const nextSignature = JSON.stringify(game.board);
		if (nextSignature === boardSignature) return;

		boardSignature = nextSignature;
		animator.syncFromBoard(game.board);
	});

	$effect(() => {
		if (!boardContainer || !game) return;

		const updateCellSize = () => {
			if (!boardContainer) return;
			const boardSize = game.boardSize;
			const containerWidth = boardContainer.clientWidth;
			cellSize = (containerWidth - PADDING * 2 - GAP * (boardSize - 1)) / boardSize;
		};

		updateCellSize();
		const observer = new ResizeObserver(updateCellSize);
		observer.observe(boardContainer);

		return () => observer.disconnect();
	});

	onDestroy(() => {
		animator.destroy();
	});

	/**
	 * Undo last move and reset the board visuals immediately
	 */
	function handleUndo() {
		if (!game?.canUndo) return;

		pendingEvents.splice(0, pendingEvents.length);
		const undid = game.undo();
		if (!undid) return;

		animator.syncFromBoard(game.board);
		boardSignature = JSON.stringify(game.board);
		frame += 1;
		onUndo?.();
	}

	/**
	 * Clear pending animations then restore from checkpoint
	 */
	async function handleRestoreCheckpoint() {
		pendingEvents.splice(0, pendingEvents.length);
		await onRestoreCheckpoint?.();

		const current = gameProp !== undefined ? gameProp : gameState.currentGame;
		if (current) {
			animator.syncFromBoard(current.board);
			boardSignature = JSON.stringify(current.board);
			syncedGame = current;
			frame += 1;
		}
	}

	/**
	 * Force visual resync from the current game board (used by replay reset/scrub)
	 */
	export function syncBoard() {
		if (!game) return;
		pendingEvents.splice(0, pendingEvents.length);
		animator.syncFromBoard(game.board);
		boardSignature = JSON.stringify(game.board);
		syncedGame = game;
		frame += 1;
	}
</script>

{#if showControls}
	<GameControls
		{animationIdle}
		onUndo={handleUndo}
		{onNewGame}
		{onSetCheckpoint}
		onRestoreCheckpoint={handleRestoreCheckpoint}
	/>
{/if}

<div
	class="board-container"
	bind:this={boardContainer}
	style:--board-radius={`${BOARD_BORDER_RADIUS}px`}
>
	<div
		class="game-board"
		style:background={theme.boardBackground}
		style:grid-template-columns={`repeat(${game?.boardSize ?? 4}, 1fr)`}
		style:grid-template-rows={`repeat(${game?.boardSize ?? 4}, 1fr)`}
		style:gap={`${GAP}px`}
		style:padding={`${PADDING}px`}
	>
		{#each Array.from({ length: (game?.boardSize ?? 4) ** 2 }, (_, index) => index) as index (index)}
			<div class="tile empty" style:background={theme.emptyTile}></div>
		{/each}
	</div>

	<div class="tile-layer" aria-hidden="true">
		{#each renderTiles as tile (tile.id)}
			<div class="tile" style={tileStyle(tile)}>
				{tile.value}
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.board-container {
		position: relative;
		width: 100%;
		margin-bottom: 20px;
	}

	.game-board {
		display: grid;
		aspect-ratio: 1;
		border-radius: var(--board-radius, 8px);
		position: relative;
		z-index: 1;
	}

	.tile-layer {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.tile {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		text-align: center;
		padding: 0.2em;
		will-change: transform, opacity;
	}

	.tile.empty {
		position: relative;
		border-radius: 6px;
	}
</style>
