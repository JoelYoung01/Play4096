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
	<h1 class=" text-3xl font-bold text-[var(--color-primary)]">Leaderboard</h1>
	<p class="mb-4 text-sm text-gray-500">Time frame leaderboards are coming soon!</p>
	<div class="mb-3 flex items-center gap-2">
		{#each availableLeaderboards as leaderboard, key (key)}
			<form method="get" action={leaderboard.href} class="flex-1">
				<button
					disabled={leaderboard.disabled}
					class="w-full rounded-md py-2 text-center font-bold text-gray-800 {activePage?.key ===
					leaderboard.key
						? 'bg-[var(--color-secondary)] '
						: 'bg-gray-200'}"
				>
					{leaderboard.label}
				</button>
			</form>
		{/each}
	</div>

	{@render children?.()}

	{#if page.data.user?.level !== USER_LEVELS.PRO}
		<p class="mt-4 text-center text-sm text-gray-500">
			Want to see your name on the leaderboard?<br />
			<a href="/stripe" class="text-[var(--color-primary)]">Upgrade to pro</a> to show off your skills!
		</p>
	{/if}
</main>
