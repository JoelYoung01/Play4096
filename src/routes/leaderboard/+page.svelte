<script>
	import { USER_LEVELS } from "$lib/constants.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	let { data } = $props();

	let showUserRow = $derived(
		!!data.userRank &&
			data.user?.level === USER_LEVELS.PRO &&
			!data.leaderboard.some((l) => l.username === data.user?.username)
	);
</script>

<Table.Root class="overflow-hidden rounded-lg border">
	<Table.Header>
		<Table.Row class="bg-secondary hover:bg-secondary">
			<Table.Head class="px-4 py-3 text-sm font-semibold tracking-wide uppercase">Rank</Table.Head>
			<Table.Head class="px-4 py-3 text-sm font-semibold tracking-wide uppercase">
				Username
			</Table.Head>
			<Table.Head class="px-4 py-3 text-end text-sm font-semibold tracking-wide uppercase">
				Score
			</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each data.leaderboard as leaderboardItem, index (index)}
			<Table.Row class={index % 2 === 0 ? "bg-muted/60" : "bg-background"}>
				<Table.Cell class="w-16 px-4 py-3 font-semibold text-foreground"># {index + 1}</Table.Cell>
				<Table.Cell class="px-4 py-3 font-medium text-foreground">
					{leaderboardItem.displayName || leaderboardItem.username}
					{#if leaderboardItem.id === data.user?.id}
						<Badge variant="secondary" class="ml-2">You</Badge>
					{/if}
				</Table.Cell>
				<Table.Cell class="px-4 py-3 text-end font-bold text-foreground">
					{leaderboardItem.bestScore?.toLocaleString()}
				</Table.Cell>
			</Table.Row>
		{/each}
		{#if showUserRow}
			<Table.Row class="bg-muted/60">
				<Table.Cell colspan={3} class="text-center text-lg font-bold text-muted-foreground">
					...
				</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell class="px-4 py-3 font-semibold text-foreground">
					# {data.userRank}
				</Table.Cell>
				<Table.Cell class="px-4 py-3 font-medium text-foreground">
					{data.user?.displayName || data.user?.username}
				</Table.Cell>
				<Table.Cell class="px-4 py-3 text-end font-bold text-foreground">
					{(data.user?.bestScore || 0).toLocaleString()}
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
