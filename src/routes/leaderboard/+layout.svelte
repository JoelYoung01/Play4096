<script>
	import { page } from "$app/state";
	import { USER_LEVELS } from "$lib/constants";

	const availableLeaderboards = [
		{
			key: "leaderboard",
			label: "All Time",
			href: "/leaderboard",
		},
		{
			key: "daily",
			label: "Daily",
			href: "/leaderboard/daily",
		},
		{
			key: "weekly",
			label: "Weekly",
			href: "/leaderboard/weekly",
		},
		{
			key: "monthly",
			label: "Monthly",
			href: "/leaderboard/monthly",
		},
	];

	let activePage = $derived(
		availableLeaderboards.find((leaderboard) => leaderboard.href === page.url.pathname)
	);

	let { children } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-lg p-8 pb-28">
	<h1 class="text-3xl font-bold text-primary">Leaderboard</h1>
	<p class="mb-4 text-sm text-muted-foreground">Classic high scores by time frame.</p>
	<div class="mb-3 flex items-center gap-2">
		{#each availableLeaderboards as leaderboard, key (key)}
			<form method="get" action={leaderboard.href} class="flex-1">
				<button
					class="w-full rounded-md py-2 text-center text-sm font-bold sm:text-base {activePage?.key ===
					leaderboard.key
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				>
					{leaderboard.label}
				</button>
			</form>
		{/each}
	</div>

	{@render children?.()}

	{#if page.data.user?.level !== USER_LEVELS.PRO}
		<p class="mt-4 text-center text-sm text-muted-foreground">
			Want to see your name on the leaderboard?<br />
			<a href="/stripe" class="text-primary hover:underline">Upgrade to pro</a> to show off your skills!
		</p>
	{/if}
</main>
