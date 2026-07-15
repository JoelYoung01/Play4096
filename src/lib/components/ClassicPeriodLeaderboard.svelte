<script>
	import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { LEADERBOARD_PERIODS } from "$lib/leaderboardPeriods.js";

	/**
	 * @typedef {Object} ClassicLeaderboardData
	 * @property {string} period
	 * @property {string} periodTitle
	 * @property {string} rangeLabel
	 * @property {string | null} prevDate
	 * @property {string | null} nextDate
	 * @property {boolean} isCurrent
	 * @property {{ id: string; username: string; displayName: string | null; bestScore: number }[]} leaderboard
	 * @property {number | null} userRank
	 * @property {number | null} userBestScore
	 * @property {{ id?: string; username?: string; displayName?: string | null } | null} user
	 */

	/** @type {{ data: ClassicLeaderboardData }} */
	let { data } = $props();

	const basePath = $derived(`/leaderboard/${data.period}`);

	const periodNoun = $derived(
		data.period === LEADERBOARD_PERIODS.DAILY
			? "day"
			: data.period === LEADERBOARD_PERIODS.WEEKLY
				? "week"
				: "month"
	);

	const showUserRow = $derived(
		data.userRank != null &&
			data.userBestScore != null &&
			!data.leaderboard.some((l) => l.id === data.user?.id)
	);
</script>

<div class="mb-4 flex items-center justify-between gap-2">
	{#if data.prevDate}
		<Button
			href="{basePath}?date={data.prevDate}"
			variant="secondary"
			size="sm"
			class="gap-0.5"
			aria-label="Previous {periodNoun}"
		>
			<ChevronLeftIcon size={16} />
			<span class="hidden sm:inline">Prev</span>
		</Button>
	{:else}
		<span class="inline-flex w-14"></span>
	{/if}

	<div class="min-w-0 flex-1 text-center">
		<p class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
			{data.periodTitle} high scores
		</p>
		<p class="truncate text-sm font-semibold text-foreground">{data.rangeLabel}</p>
	</div>

	{#if data.nextDate}
		<Button
			href="{basePath}?date={data.nextDate}"
			variant="secondary"
			size="sm"
			class="gap-0.5"
			aria-label="Next {periodNoun}"
		>
			<span class="hidden sm:inline">Next</span>
			<ChevronRightIcon size={16} />
		</Button>
	{:else}
		<span class="inline-flex w-14"></span>
	{/if}
</div>

<p class="mb-4 text-center text-xs text-muted-foreground">
	Best completed classic game score for this {periodNoun} (Central Time).
</p>

{#if data.leaderboard.length === 0}
	<p class="rounded-lg bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
		No completed scores for this {periodNoun} yet.
	</p>
{:else}
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
