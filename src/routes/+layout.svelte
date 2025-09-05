<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.png";
	import { page } from "$app/state";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>4096 - The Ultimate Tile-Matching Puzzle Game</title>
	<meta
		name="description"
		content="Play 4096, the challenging tile-matching puzzle game! Join numbered tiles to reach 4096. Features leaderboards, user accounts, and game replays. Inspired by the classic 2048 game."
	/>
	<meta
		name="keywords"
		content="4096, 2048, puzzle game, tile game, number game, brain game, strategy game, online game"
	/>
	<meta name="author" content="Play4096" />
	<meta name="robots" content="index, follow" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://play4096.com/" />
	<meta property="og:title" content="4096 - The Ultimate Tile-Matching Puzzle Game" />
	<meta
		property="og:description"
		content="Play 4096, the challenging tile-matching puzzle game! Join numbered tiles to reach 4096. Features leaderboards, user accounts, and game replays."
	/>
	<meta property="og:image" content="/favicon.png" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://play4096.com/" />
	<meta property="twitter:title" content="4096 - The Ultimate Tile-Matching Puzzle Game" />
	<meta
		property="twitter:description"
		content="Play 4096, the challenging tile-matching puzzle game! Join numbered tiles to reach 4096. Features leaderboards, user accounts, and game replays."
	/>
	<meta property="twitter:image" content="/favicon.png" />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "4096",
			"description": "A challenging tile-matching puzzle game where players combine numbered tiles to reach 4096",
			"url": "https://play4096.com",
			"applicationCategory": "Game",
			"operatingSystem": "Web Browser",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"creator": {
				"@type": "Organization",
				"name": "Play4096"
			}
		}
	</script>
</svelte:head>

<div class="app-container" style:background-color={page.data.theme?.background}>
	{@render children?.()}
</div>

<style lang="postcss">
	.app-container {
		overflow: hidden;

		/* Prevent Chrome's pull-to-refresh and other touch gestures */
		touch-action: none;
		user-select: none;
		overscroll-behavior: contain;
		user-drag: none;
		/* Additional gesture prevention */
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-webkit-overflow-scrolling: touch;
		-webkit-overscroll-behavior: contain;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
	}
</style>
