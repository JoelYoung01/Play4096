<script>
	import { CHALLENGE_TYPES } from "$lib/challenges.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
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

<main class="mx-auto h-full w-full max-w-lg overflow-y-auto px-4 pt-8 pb-28 text-foreground">
	<a
		href="/challenges/{challenge.id}"
		class="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
	>
		<ArrowLeftIcon size={16} />
		Back to challenge
	</a>

	<p class="mb-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
		{#if data.isToday}
			Today's challenge
		{:else}
			Daily challenge
		{/if}
		{#if data.dateStr}
			· {formatDate(data.dateStr)}
		{/if}
	</p>
	<h1 class="text-3xl font-bold text-primary">Leaderboard</h1>
	<p class="mb-1 text-base font-semibold text-foreground">{challenge.title}</p>
	<p class="mb-6 text-sm text-muted-foreground">
		{challenge.difficulty} · {data.typeLabel}
		{#if challenge.type === CHALLENGE_TYPES.RECOVERY}
			· fewer moves ranks higher
		{:else}
			· higher score ranks higher
		{/if}
	</p>
	<p class="mb-6 text-sm text-muted-foreground">{data.overview}</p>

	{#if data.leaderboard.length === 0}
		<p class="rounded-lg bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
			No clears yet for this day. Be the first on the board!
		</p>
	{:else}
		<Table.Root class="overflow-hidden rounded-lg border">
			<Table.Header>
				<Table.Row class="bg-secondary hover:bg-secondary">
					<Table.Head class="px-4 py-3 text-sm font-semibold tracking-wide uppercase">
						Rank
					</Table.Head>
					<Table.Head class="px-4 py-3 text-sm font-semibold tracking-wide uppercase">
						Username
					</Table.Head>
					<Table.Head class="px-4 py-3 text-end text-sm font-semibold tracking-wide uppercase">
						{scoreLabel}
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.leaderboard as leaderboardItem, index (leaderboardItem.id)}
					<Table.Row class={index % 2 === 0 ? "bg-muted/60" : "bg-background"}>
						<Table.Cell class="w-16 px-4 py-3 font-semibold text-foreground">
							# {index + 1}
						</Table.Cell>
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
							{data.userBestScore?.toLocaleString()}
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{/if}
</main>
