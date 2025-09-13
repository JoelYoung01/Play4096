<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.png";
	import { page } from "$app/state";
	import FooterNav from "./FooterNav.svelte";
	import Seo from "./Seo.svelte";

	let { children } = $props();

	/**
	 * Utility function to darken a color
	 * @param {string} hex
	 * @param {number} amount
	 * @returns {string}
	 */
	function darkenColor(hex, amount = 0.2) {
		// Remove # if present
		hex = hex.replace("#", "");

		// Convert to RGB
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Darken by reducing each RGB value
		const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
		const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
		const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));

		// Convert back to hex
		return `#${darkenedR.toString(16).padStart(2, "0")}${darkenedG.toString(16).padStart(2, "0")}${darkenedB.toString(16).padStart(2, "0")}`;
	}

	// Set CSS variables from theme
	$effect(() => {
		const theme = page.data.theme;
		if (theme) {
			const root = document.documentElement;

			// Set main theme colors
			root.style.setProperty("--color-primary", theme.primary);
			root.style.setProperty("--color-primary-dark", darkenColor(theme.primary, 0.2));
			root.style.setProperty("--color-primary-darker", darkenColor(theme.primary, 0.4));
			root.style.setProperty("--color-secondary", theme.secondary);
			root.style.setProperty("--color-secondary-dark", darkenColor(theme.secondary, 0.2));
			root.style.setProperty("--color-secondary-darker", darkenColor(theme.secondary, 0.4));
			root.style.setProperty("--color-background", theme.background);
			root.style.setProperty("--color-board-background", theme.boardBackground);
			root.style.setProperty("--color-empty-tile", theme.emptyTile);
			root.style.setProperty("--color-text-light", theme.textLight);
			root.style.setProperty("--color-text-dark", theme.textDark);
			root.style.setProperty("--color-unknown-tile", theme.unknownTile);

			// Set numeric theme properties
			root.style.setProperty("--text-scale", theme.textScale);
			root.style.setProperty("--luminance-threshold", theme.luminanceThreshold);
			root.style.setProperty("--movement-speed", `${theme.movementSpeed}ms`);

			// Set tile colors
			if (theme.tiles) {
				Object.entries(theme.tiles).forEach(([value, color]) => {
					root.style.setProperty(`--color-tile-${value}`, color);
				});
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>4096 - The Ultimate Tile-Matching Puzzle Game</title>
</svelte:head>

<Seo />

<div class="app-container">
	{@render children?.()}

	<FooterNav />
</div>

<style lang="postcss">
	.app-container {
		overflow: hidden;
		position: relative;
		height: 100dvh;
		background-color: var(--color-background);
	}
</style>
