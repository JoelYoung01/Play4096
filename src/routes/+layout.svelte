<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.png";
	import { page } from "$app/state";
	import FooterNav from "./FooterNav.svelte";
	import Seo from "./Seo.svelte";
	import { saveThemeId } from "$lib/localStorage.svelte";
	import { applyThemeTokens } from "$lib/themeTokens.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();

	// Keep localStorage in sync with the resolved server theme
	$effect(() => {
		if (page.data.themeId) {
			saveThemeId(page.data.themeId);
		}
	});

	// Map active theme preset → shadcn + game CSS variables
	$effect(() => {
		const theme = page.data.theme;
		if (theme) {
			applyThemeTokens(document.documentElement.style, theme);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>4096 - The Ultimate Tile-Matching Puzzle Game</title>
</svelte:head>

<Seo />

<div class="app-container bg-background text-foreground">
	{@render children?.()}

	<FooterNav />
	<Toaster />
</div>

<style lang="postcss">
	.app-container {
		position: relative;
		min-height: 100dvh;
	}
</style>
