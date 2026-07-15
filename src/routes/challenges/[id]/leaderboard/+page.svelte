<script>
	import { page } from "$app/state";
	import { CHALLENGE_TYPES } from "$lib/challenges.js";
	import { ArrowLeftIcon } from "@lucide/svelte";

	let { data } = $props();

	const challenge = $derived(data.challenge);
	const scoreLabel = $derived(challenge.type === CHALLENGE_TYPES.RECOVERY ? "Moves" : "Score");

	const showUserRow = $derived(
		data.userRank != null &&
			data.userBestScore != null &&
			!data.leaderboard.some((l) => l.id === data.user?.id)
	);

	/**
	 * @param {string | null | undefined} dateStr
	 */
	function formatDate(dateStr) {
		if (!dateStr) return "";
		const [y, m, d] = dateStr.split("-").map(Number);
		return new Date(Date.UTC(y, m - 1, d, 18)).toLocaleDateString(undefined, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		});
	}
</script>

<svelte:head>
	<title>Leaderboard · {challenge.title} - Challenges - 4096</title>
</svelte:head>

<main
	class="mx-auto h-full w-full max-w-lg overflow-y-auto px-4 pt-8 pb-28"
	style:color={page.data.theme?.text}
>
	<a
		href="/challenges/{challenge.id}"
		class="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
	>
		<ArrowLeftIcon size={16} />
		Back to challenge
	</a>

	<p class="mb-1 text-xs font-bold tracking-wide text-gray-500 uppercase">
		{#if data.isToday}
			Today's challenge
		{:else}
			Daily challenge
		{/if}
		{#if data.dateStr}
			· {formatDate(data.dateStr)}
		{/if}
	</p>
	<h1 class="text-3xl font-bold text-[var(--color-primary)]">Leaderboard</h1>
	<p class="mb-1 text-base font-semibold text-gray-800">{challenge.title}</p>
	<p class="mb-6 text-sm text-gray-500">
		{challenge.difficulty} · {data.typeLabel}
		{#if challenge.type === CHALLENGE_TYPES.RECOVERY}
			· fewer moves ranks higher
		{:else}
			· higher score ranks higher
		{/if}
	</p>
	<p class="mb-6 text-sm text-gray-600">{data.overview}</p>

	{#if data.leaderboard.length === 0}
		<p class="rounded-lg bg-gray-100 px-4 py-8 text-center text-sm text-gray-600">
			No clears yet for this day. Be the first on the board!
		</p>
	{:else}
		<table class="w-full border-collapse overflow-hidden rounded-lg">
			<thead>
				<tr class="bg-[var(--color-secondary)] text-gray-700">
					<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Rank</th>
					<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Username</th
					>
					<th class="px-4 py-3 text-end text-sm font-semibold tracking-wide uppercase"
						>{scoreLabel}</th
					>
				</tr>
			</thead>
			<tbody>
				{#each data.leaderboard as leaderboardItem, index (leaderboardItem.id)}
					<tr
						class="transition-colors hover:bg-green-200 {index % 2 === 0
							? 'bg-gray-200'
							: 'bg-gray-100'}"
					>
						<td class="w-16 px-4 py-3 font-semibold text-gray-700"># {index + 1}</td>
						<td class="px-4 py-3 font-medium text-gray-700">
							{leaderboardItem.displayName || leaderboardItem.username}
							{#if leaderboardItem.id === data.user?.id}
								<span class="text-xs text-gray-500">You</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-end font-bold text-gray-700">
							{leaderboardItem.bestScore?.toLocaleString()}
						</td>
					</tr>
				{/each}
				{#if showUserRow}
					<tr class="bg-gray-200 transition-colors hover:bg-green-200">
						<td colspan="3" class="text-center text-lg font-bold text-gray-700">...</td>
					</tr>
					<tr class="bg-gray-100 transition-colors hover:bg-green-200">
						<td class="px-4 py-3 font-semibold text-gray-700"># {data.userRank}</td>
						<td class="px-4 py-3 font-medium text-gray-700">
							{data.user?.displayName || data.user?.username}
						</td>
						<td class="px-4 py-3 text-end font-bold text-gray-700">
							{data.userBestScore?.toLocaleString()}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	{/if}
</main>
