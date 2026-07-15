<script>
	import BoardPreview from "$lib/components/BoardPreview.svelte";

	/**
	 * Theme picker mini-board using the shared BoardPreview geometry.
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

	/** @type {{ theme: PreviewTheme, selected?: boolean }} */
	let { theme, selected = false } = $props();

	const sampleBoard = [
		[2, 4, 8, 16],
		[0, 32, 64, 128],
		[0, 256, 512, 1024],
		[0, 2048, 4096, 0],
	];
</script>

<BoardPreview {theme} board={sampleBoard} {selected} />
