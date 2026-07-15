<script>
	import { CHALLENGE_TYPES } from "$lib/challenges.js";
	import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/svelte";

	let { data } = $props();

	const scoreLabel = $derived(data.challenge.type === CHALLENGE_TYPES.RECOVERY ? "Moves" : "Score");

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
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		});
	}
</script>

<div class="mb-4 flex items-center justify-between gap-2">
	{#if data.prevDate}
		<a
			href="/leaderboard/daily?date={data.prevDate}"
			class="inline-flex items-center gap-0.5 rounded-md bg-gray-200 px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
			aria-label="Previous day"
		>
			<ChevronLeftIcon size={16} />
			<span class="hidden sm:inline">Prev</span>
		</a>
	{:else}
		<span class="inline-flex w-14"></span>
	{/if}

	<div class="min-w-0 flex-1 text-center">
		<p class="text-xs font-bold tracking-wide text-gray-500 uppercase">
			{#if data.isToday}
				Today's challenge
			{:else}
				Daily challenge
			{/if}
		</p>
		<p class="truncate text-sm font-semibold text-gray-800">{formatDate(data.dateStr)}</p>
	</div>

	{#if data.nextDate}
		<a
			href="/leaderboard/daily?date={data.nextDate}"
			class="inline-flex items-center gap-0.5 rounded-md bg-gray-200 px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
			aria-label="Next day"
		>
			<span class="hidden sm:inline">Next</span>
			<ChevronRightIcon size={16} />
		</a>
	{:else}
		<span class="inline-flex w-14"></span>
	{/if}
</div>

<div class="mb-4 text-center">
	<a
		href="/challenges/{data.challenge.id}"
		class="text-base font-bold text-[var(--color-primary)] hover:underline"
	>
		{data.challenge.title}
	</a>
	<p class="text-sm text-gray-500">{data.challenge.difficulty} · {data.challenge.description}</p>
</div>

{#if data.leaderboard.length === 0}
	<p class="rounded-lg bg-gray-100 px-4 py-8 text-center text-sm text-gray-600">
		No clears yet for this day. Be the first on the board!
	</p>
{:else}
	<table class="w-full border-collapse overflow-hidden rounded-lg">
		<thead>
			<tr class="bg-[var(--color-secondary)] text-gray-700">
				<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Rank</th>
				<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Username</th>
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
