<script>
	import { page } from "$app/state";

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
			disabled: true,
		},
		{
			key: "weekly",
			label: "Weekly",
			href: "/leaderboard/weekly",
			disabled: true,
		},
		{
			key: "monthly",
			label: "Monthly",
			href: "/leaderboard/monthly",
			disabled: true,
		},
	];

	let activePage = $derived(
		availableLeaderboards.find((leaderboard) => leaderboard.href === page.url.pathname)
	);

	let { children } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-lg p-8">
	<h1 class="mb-2 text-3xl font-bold" style:color={page.data.theme?.primary}>Leaderboard</h1>
	<div class="mb-3 flex items-center gap-2">
		{#each availableLeaderboards as leaderboard, key (key)}
			<form method="get" action={leaderboard.href} class="flex-1">
				<button
					disabled={leaderboard.disabled}
					class="w-full rounded-md py-2 text-center font-bold {activePage?.key === leaderboard.key
						? 'bg-green-500 text-white'
						: 'bg-gray-200 text-gray-800'}"
				>
					{leaderboard.label}
				</button>
			</form>
		{/each}
	</div>

	{@render children?.()}

	<p class="mt-4 text-center text-sm text-gray-500">
		Want to see your name on the leaderboard?<br />
		Upgrade to pro to show off your skills!
	</p>
</main>
