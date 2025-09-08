<script>
	import { page } from "$app/state";
	import { Grid2x2Icon, HouseIcon, TrophyIcon, Undo2Icon, UserIcon } from "@lucide/svelte";

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
