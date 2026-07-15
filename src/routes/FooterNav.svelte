<script>
	import { page } from "$app/state";
	import {
		Grid2x2Icon,
		HouseIcon,
		TrophyIcon,
		HistoryIcon,
		UserIcon,
		TargetIcon,
	} from "@lucide/svelte";

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
			icon: TargetIcon,
			href: "/challenges",
		},
		{
			icon: TrophyIcon,
			href: "/leaderboard",
		},
		{
			icon: HistoryIcon,
			href: "/replay",
		},
		{
			icon: UserIcon,
			href: "/account",
		},
	];

	let activeNavItem = $derived(
		navItems.find((item) =>
			item.href === "/" ? page.url.pathname === item.href : page.url.pathname.includes(item.href)
		)
	);
</script>

<nav
	class="fixed bottom-1 left-1/2 z-50 flex -translate-x-1/2 justify-between gap-2 rounded-full bg-secondary p-1 text-secondary-foreground shadow-lg ring-1 ring-border/50 sm:bottom-10"
>
	{#each navItems as navItem, index (index)}
		{@const IconComponent = navItem.icon}
		<a
			href={navItem.href}
			class="rounded-full p-2 transition-colors {activeNavItem === navItem
				? 'bg-primary text-primary-foreground'
				: 'bg-background text-foreground hover:bg-muted'}"
			aria-current={activeNavItem === navItem ? "page" : undefined}
		>
			<IconComponent />
		</a>
	{/each}
</nav>
