<script>
	import { USER_LEVELS } from "$lib/constants.js";

	let { data } = $props();

	let showUserRow = $derived(
		!!data.userRank &&
			data.user?.level === USER_LEVELS.PRO &&
			!data.leaderboard.some((l) => l.username === data.user?.username)
	);
</script>

<table class="w-full border-collapse overflow-hidden rounded-lg">
	<thead>
		<tr class="bg-green-500 text-white">
			<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Rank</th>
			<th class="px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase">Username</th>
			<th class="px-4 py-3 text-end text-sm font-semibold tracking-wide uppercase">Score</th>
		</tr>
	</thead>
	<tbody>
		{#each data.leaderboard as leaderboardItem, index (index)}
			<tr
				class="transition-colors hover:bg-green-200 {index % 2 === 0
					? 'bg-gray-200'
					: 'bg-gray-100'}"
			>
				<td class="w-16 px-4 py-3 font-semibold text-gray-700"># {index + 1}</td>
				<td class="px-4 py-3 font-medium text-gray-700"
					>{leaderboardItem.displayName || leaderboardItem.username}</td
				>
				<td class="px-4 py-3 text-end font-bold text-gray-700">{leaderboardItem.bestScore}</td>
			</tr>
		{/each}
		{#if showUserRow}
			<tr class="bg-gray-200 transition-colors hover:bg-green-200">
				<td colspan="3" class="text-center text-lg font-bold text-gray-700"> ... </td>
			</tr>
			<tr class="bg-gray-100 transition-colors hover:bg-green-200">
				<td class="px-4 py-3 font-semibold text-gray-700">
					# {data.userRank}
				</td>
				<td class="px-4 py-3 font-medium text-gray-700">
					{data.user?.displayName || data.user?.username}
				</td>
				<td class="px-4 py-3 text-end font-bold text-gray-700">
					{data.user?.bestScore || 0}
				</td>
			</tr>
		{/if}
	</tbody>
</table>
