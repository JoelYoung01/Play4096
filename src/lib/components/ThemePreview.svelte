<script>
	/**
	 * Mini board preview using theme tokens.
	 * @typedef {Object} PreviewTheme
	 * @property {string} boardBackground
	 * @property {string} emptyTile
	 * @property {string} [primary]
	 * @property {Record<number, string>} [tiles]
	 * @property {string} [textDark]
	 * @property {string} [textLight]
	 * @property {number} [luminanceThreshold]
	 */

	/** @type {{ theme: PreviewTheme, selected?: boolean }} */
	let { theme, selected = false } = $props();

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
</script>

<div
	class="preview-board"
	class:selected
	style:background={theme.boardBackground}
	aria-hidden="true"
>
	{#each previewValues as value, i (i)}
		{#if value == null}
			<div class="preview-tile empty" style:background={theme.emptyTile}></div>
		{:else}
			{@const bg = tileBg(value, theme)}
			<div
				class="preview-tile"
				style:background={bg}
				style:color={isLight(bg) ? (theme.textLight ?? "#333") : (theme.textDark ?? "#fff")}
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
		gap: 4px;
		padding: 6px;
		border-radius: 8px;
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
		border-radius: 4px;
		font-size: 0.55rem;
		font-weight: 700;
		min-height: 0;
	}

	.preview-tile.empty {
		color: transparent;
	}
</style>
