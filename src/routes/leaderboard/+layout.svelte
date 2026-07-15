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
		availableLeaderboards.find((leaderboard) => leaderboard.href === page.url.pathname) ??
			(page.url.pathname.startsWith("/leaderboard/challenge")
				? { key: "challenge", label: "Challenge", href: "/leaderboard/challenge" }
				: undefined)
	);

	const isChallengeBoard = $derived(page.url.pathname.startsWith("/leaderboard/challenge"));

	let { children } = $props();
</script>

<main class="mx-auto mt-10 w-full max-w-lg p-8 pb-28">
	<h1 class=" text-3xl font-bold text-[var(--color-primary)]">Leaderboard</h1>
	<p class="mb-4 text-sm text-gray-500">
		{#if isChallengeBoard}
			Global rankings for each day's daily challenge.
		{:else}
			Classic high scores by time frame. Challenge rankings live on the challenge board.
		{/if}
	</p>
	<div class="mb-2 flex items-center gap-2">
		{#each availableLeaderboards as leaderboard, key (key)}
			<form method="get" action={leaderboard.href} class="flex-1">
				<button
					class="w-full rounded-md py-2 text-center text-sm font-bold text-gray-800 sm:text-base {activePage?.key ===
					leaderboard.key
						? 'bg-[var(--color-secondary)] '
						: 'bg-gray-200'}"
				>
					{leaderboard.label}
				</button>
			</form>
		{/each}
	</div>
	<p class="mb-3 text-center text-xs">
		<a
			href="/leaderboard/challenge"
			class="font-semibold text-[var(--color-primary)] hover:underline {isChallengeBoard
				? 'underline'
				: ''}"
		>
			Daily challenge board
		</a>
	</p>

	{@render children?.()}

	{#if page.data.user?.level !== USER_LEVELS.PRO}
		<p class="mt-4 text-center text-sm text-gray-500">
			Want to see your name on the leaderboard?<br />
			<a href="/stripe" class="text-[var(--color-primary)]">Upgrade to pro</a> to show off your skills!
		</p>
	{/if}
</main>
