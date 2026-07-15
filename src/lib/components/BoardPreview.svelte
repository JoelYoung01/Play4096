<script>
	import { onMount } from "svelte";
	import {
		BOARD_BORDER_RADIUS,
		BOARD_GAP,
		BOARD_PADDING,
		TILE_BORDER_RADIUS,
	} from "$lib/boardConstants.js";
	import { getTileBackground, getTileColor } from "$lib/game.svelte.js";

	/**
	 * Static board preview using the same geometry ratios as AnimatedBoard.
	 * @typedef {Object} PreviewTheme
	 * @property {string} boardBackground
	 * @property {string} emptyTile
	 * @property {string} [primary]
	 * @property {Record<number, string>} [tiles]
	 * @property {string} [unknownTile]
	 * @property {string} [textDark]
	 * @property {string} [textLight]
	 * @property {number} [luminanceThreshold]
	 * @property {number} [textScale]
	 */

	/**
	 * @type {{
	 *   theme: PreviewTheme;
	 *   board: (number | null | undefined)[][];
	 *   selected?: boolean;
	 * }}
	 */
	let { theme, board, selected = false } = $props();

	/** Typical mobile in-game board width (~390 viewport minus page padding) */
	const REF_BOARD_WIDTH = 350;

	const size = $derived(Math.max(board?.length ?? 4, 1));

	/** @type {HTMLDivElement | null} */
	let boardEl = $state(null);
	let cellSize = $state(0);
	let gap = $state(BOARD_GAP);
	let padding = $state(BOARD_PADDING);
	let tileRadius = $state(TILE_BORDER_RADIUS);
	let boardRadius = $state(BOARD_BORDER_RADIUS);

	/**
	 * Match AnimatedBoard mobile font scaling, scaled to preview cell size.
	 * AnimatedBoard uses 2.5rem base on mobile (viewport ≤600); theme.textScale
	 * is a desktop rem base, not a multiplier.
	 * @param {number} value
	 */
	function tileFontSize(value) {
		if (!cellSize) return "0.65rem";
		const fullBaseRem = 2.5;
		const fullCellRef = (REF_BOARD_WIDTH - BOARD_PADDING * 2 - BOARD_GAP * (size - 1)) / size;
		const scale = cellSize / fullCellRef;
		const baseRem = fullBaseRem * scale;
		const digits = value.toString().length;
		const fontRem = Math.max(baseRem - (digits - 1) * 0.3 * scale, 0.4);
		return `${fontRem}rem`;
	}

	onMount(() => {
		if (!boardEl) return;

		const update = () => {
			if (!boardEl) return;
			const width = boardEl.clientWidth;
			const scale = width / REF_BOARD_WIDTH;
			gap = Math.max(2, BOARD_GAP * scale);
			padding = Math.max(2, BOARD_PADDING * scale);
			tileRadius = Math.max(2, TILE_BORDER_RADIUS * scale);
			boardRadius = Math.max(3, BOARD_BORDER_RADIUS * scale);
			cellSize = (width - padding * 2 - gap * (size - 1)) / size;
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(boardEl);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={boardEl}
	class="preview-board"
	class:selected
	style:background={theme.boardBackground}
	style:gap={`${gap}px`}
	style:padding={`${padding}px`}
	style:border-radius={`${boardRadius}px`}
	style:grid-template-columns={`repeat(${size}, 1fr)`}
	style:grid-template-rows={`repeat(${size}, 1fr)`}
	aria-hidden="true"
>
	{#each board as row, ri (ri)}
		{#each row as cell, ci (`${ri}-${ci}`)}
			{#if cell}
				<div
					class="preview-tile"
					style:background={getTileBackground(cell, theme)}
					style:color={getTileColor(cell, theme)}
					style:border-radius={`${tileRadius}px`}
					style:font-size={tileFontSize(cell)}
				>
					{cell}
				</div>
			{:else}
				<div
					class="preview-tile empty"
					style:background={theme.emptyTile}
					style:border-radius={`${tileRadius}px`}
				></div>
			{/if}
		{/each}
	{/each}
</div>

<style>
	.preview-board {
		display: grid;
		width: 100%;
		aspect-ratio: 1;
		box-sizing: border-box;
	}

	.preview-board.selected {
		outline: 3px solid var(--color-primary, #e88f4f);
		outline-offset: 2px;
	}

	.preview-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		min-height: 0;
		min-width: 0;
		padding: 0.1em;
		text-align: center;
		line-height: 1;
	}

	.preview-tile.empty {
		color: transparent;
	}
</style>
