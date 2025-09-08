<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.png";
	import { page } from "$app/state";
	import { Grid2x2Icon, HouseIcon, TrophyIcon, Undo2Icon, UserIcon } from "@lucide/svelte";

	let { children } = $props();

	const navItems = [
		{
			icon: HouseIcon,
			href: "/",
		},
		{
			icon: Grid2x2Icon,
			href: "/game",
		},
		{
			icon: TrophyIcon,
			href: "/leaderboard",
		},
		{
			icon: Undo2Icon,
			href: "/replay",
		},
		{
			icon: UserIcon,
			href: "/account",
		},
	];

	let activeNavItem = $derived(navItems.find((item) => item.href === page.url.pathname));
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

	<!-- Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap"
		rel="stylesheet"
		crossorigin="anonymous"
	/>

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

<div class="app-container h-screen" style:background-color={page.data.theme?.background}>
	{@render children?.()}

	<nav
		class="absolute bottom-1 left-1/2 flex -translate-x-1/2 justify-between gap-2 rounded-full p-1 sm:bottom-10"
		style:background-color={page.data.theme?.boardBackground}
		style:color={page.data.theme?.text}
	>
		{#each navItems as navItem, index (index)}
			{@const IconComponent = navItem.icon}
			<a
				href={navItem.href}
				class="rounded-full p-2"
				style:background-color={activeNavItem === navItem
					? page.data.theme?.primary
					: page.data.theme?.emptyTile}
				style:color={activeNavItem === navItem
					? page.data.theme?.textDark
					: page.data.theme?.textDark}
			>
				<IconComponent />
			</a>
		{/each}
	</nav>
</div>

<style lang="postcss">
	.app-container {
		overflow: hidden;
		position: relative;

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
