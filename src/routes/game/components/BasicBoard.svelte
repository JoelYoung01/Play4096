<script>
	import { getTileBackground, getTileColor } from "$lib/game.svelte.js";
	import { defaultTheme } from "$lib/assets/themes.js";
	import { EVENT_TYPES } from "$lib/constants.js";

	import GameControls from "./GameControls.svelte";
	import { gameState } from "../state.svelte.js";

	const defaultBoard = Array(4)
		.fill(null)
		.map(() => Array(4).fill(0));

	let { pendingEvents = [] } = $props();

	let game = $derived(gameState.currentGame);

	let newestTile = $derived(pendingEvents.find((event) => event.type === EVENT_TYPES.SPAWN));
	let movedTiles = $derived(
		pendingEvents.filter((event) => event.type === EVENT_TYPES.MOVE && !event.merged)
	);
	let mergedTiles = $derived(pendingEvents.filter((event) => event.merged));

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	function isNewest(x, y) {
		return newestTile?.end.x === x && newestTile?.end.y === y;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	function isMoved(x, y) {
		return movedTiles.some((event) => event.end.x === x && event.end.y === y);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	function isMerged(x, y) {
		return mergedTiles.some((event) => event.end.x === x && event.end.y === y);
	}

	/**
	 * Get the font size for a tile
	 * @param {number} value
	 * @param {typeof defaultTheme} theme
	 * @returns {string}
	 */
	function getTileFontSize(value, theme = defaultTheme) {
		const mobile = typeof window !== "undefined" && window.innerWidth <= 600;
		const baseSize = mobile ? 2.5 : theme.textScale;
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}
</script>

<GameControls />

<!-- Game Board -->
<div class="game-board">
	{#each game?.board || defaultBoard as row, rowIndex (rowIndex)}
		{#each row as cell, colIndex (colIndex)}
			{#if cell !== 0}
				<div
					class="tile"
					class:new-tile={isNewest(colIndex, rowIndex)}
					class:moved-tile={isMoved(colIndex, rowIndex)}
					class:merged-tile={isMerged(colIndex, rowIndex)}
					style:--base-font-size={getTileFontSize(cell)}
					style:background={getTileBackground(cell)}
					style:color={getTileColor(cell)}
				>
					{cell}
				</div>
			{:else}
				<div class="tile empty"></div>
			{/if}
		{/each}
	{/each}
</div>

<style lang="postcss">
	.game-board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 10px;
		background: #bbada0;
		padding: 10px;
		border-radius: 8px;
		margin-bottom: 20px;
		aspect-ratio: 1;
	}

	.tile {
		--animation-duration: 0.1s;

		border-radius: 6px;
		display: flex;
		flex: 0 0 auto;
		overflow: hidden;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		transition: all var(--animation-duration) ease-in;
		position: relative;
		text-align: center;
		padding: 0.2em;
		font-size: var(--base-font-size, 1rem);

		&.new-tile {
			animation: tileAppear 300ms ease-in-out;
		}

		&.merged-tile {
			animation: tileMerge 200ms ease-in-out;
		}

		&.empty {
			background: #cdc1b4;
		}
	}

	@keyframes tileAppear {
		0% {
			opacity: 0;
			transform: scale(0.5);
			font-size: calc(var(--base-font-size) * 0.5);
		}
		100% {
			opacity: 1;
			transform: scale(1);
			font-size: var(--base-font-size);
		}
	}

	@keyframes tileMerge {
		0% {
			transform: scale(1);
			font-size: var(--base-font-size);
		}
		80% {
			transform: scale(1.1);
			font-size: calc(var(--base-font-size) * 1.1);
		}
		100% {
			transform: scale(1);
			font-size: var(--base-font-size);
		}
	}
</style>
