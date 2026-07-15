<script>
	import { onMount } from "svelte";
	import {
		BOARD_BORDER_RADIUS,
		BOARD_GAP,
		BOARD_PADDING,
		TILE_BORDER_RADIUS,
	} from "$lib/boardConstants.js";

	/**
	 * Mini board preview using the same geometry ratios as AnimatedBoard.
	 * @typedef {Object} PreviewTheme
	 * @property {string} boardBackground
	 * @property {string} emptyTile
	 * @property {string} [primary]
	 * @property {Record<number, string>} [tiles]
	 * @property {string} [textDark]
	 * @property {string} [textLight]
	 * @property {number} [luminanceThreshold]
	 * @property {number} [textScale]
	 */

	/** @type {{ theme: PreviewTheme, selected?: boolean }} */
	let { theme, selected = false } = $props();

	/** Typical mobile in-game board width (~390 viewport minus page padding) */
	const REF_BOARD_WIDTH = 350;

	const previewValues = [
		2,
		4,
		8,
		16,
		null,
		32,
		64,
		128,
		null,
		256,
		512,
		1024,
		null,
		2048,
		4096,
		null,
	];

	/** @type {HTMLDivElement | null} */
	let boardEl = $state(null);
	let cellSize = $state(0);
	let gap = $state(BOARD_GAP);
	let padding = $state(BOARD_PADDING);
	let tileRadius = $state(TILE_BORDER_RADIUS);
	let boardRadius = $state(BOARD_BORDER_RADIUS);

	/**
	 * @param {number} value
	 * @param {PreviewTheme} t
	 */
	function tileBg(value, t) {
		return t.tiles?.[value] ?? t.primary ?? "#888";
	}

	/**
	 * Rough luminance for preview text color
	 * @param {string} hex
	 */
	function isLight(hex) {
		const h = hex.replace("#", "");
		if (h.length < 6) return true;
		const r = parseInt(h.slice(0, 2), 16);
		const g = parseInt(h.slice(2, 4), 16);
		const b = parseInt(h.slice(4, 6), 16);
		const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return lum > (theme.luminanceThreshold ?? 0.6);
	}

	/**
	 * Match AnimatedBoard font scaling relative to cell size.
	 * @param {number} value
	 */
	function tileFontSize(value) {
		if (!cellSize) return "0.65rem";
		const fullBaseRem = 2.5;
		const fullCellRef = (REF_BOARD_WIDTH - BOARD_PADDING * 2 - BOARD_GAP * 3) / 4;
		const baseRem = fullBaseRem * (cellSize / fullCellRef);
		const digits = value.toString().length;
		const fontRem = Math.max(baseRem - (digits - 1) * 0.3 * (cellSize / fullCellRef), 0.4);
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
			cellSize = (width - padding * 2 - gap * 3) / 4;
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
	aria-hidden="true"
>
	{#each previewValues as value, i (i)}
		{#if value == null}
			<div
				class="preview-tile empty"
				style:background={theme.emptyTile}
				style:border-radius={`${tileRadius}px`}
			></div>
		{:else}
			{@const bg = tileBg(value, theme)}
			<div
				class="preview-tile"
				style:background={bg}
				style:color={isLight(bg) ? (theme.textLight ?? "#333") : (theme.textDark ?? "#fff")}
				style:border-radius={`${tileRadius}px`}
				style:font-size={tileFontSize(value)}
			>
				{value}
			</div>
		{/if}
	{/each}
</div>

<style>
	.preview-board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(4, 1fr);
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
