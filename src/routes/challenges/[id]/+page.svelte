<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import BoardPreview from "$lib/components/BoardPreview.svelte";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		formatChallengeElapsedMs,
		formatChallengeRankValue,
		formatChallengeTypeLabel,
	} from "$lib/challenges.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { CrownIcon, ArrowLeftIcon, ChevronRightIcon, TrophyIcon } from "@lucide/svelte";

	let { data } = $props();

	let starting = $state(false);

	const challenge = $derived(data.challenge);
	const typeLabel = $derived(formatChallengeTypeLabel(challenge.type));

	const previewBoard = $derived(
		!data.locked && "board" in challenge.params && Array.isArray(challenge.params.board)
			? challenge.params.board
			: null
	);

	const leaderboardHref = $derived(`/challenges/${challenge.id}/leaderboard`);

	function onStart() {
		starting = true;
		return async ({ update }) => {
			await update();
			starting = false;
		};
	}

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
	<title>{challenge.title} - Challenges - 4096</title>
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 pt-8 pb-28 text-foreground">
	<a
		href="/challenges"
		class="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
	>
		<ArrowLeftIcon size={16} />
		Calendar
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
	<h1 class="text-3xl font-bold text-primary">{challenge.title}</h1>

	{#if data.locked}
		<div
			class="mt-6 rounded-lg p-4 text-center"
			style:background-color={page.data.theme?.boardBackground}
		>
			<p class="mb-3 text-sm" style:color={page.data.theme?.textDark}>
				Past daily challenges are a Pro feature — same archive pattern as game history.
			</p>
			{#if data.user}
				<Button href="/stripe" class="justify-center gap-2">
					<CrownIcon size={20} />
					Upgrade to Pro
				</Button>
			{:else}
				<Button href="/login?redirectTo=/challenges/{challenge.id}" class="justify-center">
					Log in
				</Button>
			{/if}
		</div>
	{:else}
		<p class="mb-1 text-sm text-muted-foreground">{challenge.difficulty} · {typeLabel}</p>
		<p class="mb-6 text-base">{data.overview}</p>

		{#if previewBoard && page.data.theme}
			<div class="mb-6">
				<p class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
					Starting board
				</p>
				<BoardPreview theme={page.data.theme} board={previewBoard} />
			</div>
		{/if}

		{#if data.stats}
			<p class="mb-4 text-sm text-muted-foreground">
				{#if data.stats.bestStatus === CHALLENGE_RUN_STATUS.WON}
					You've cleared this challenge {data.stats.wins} time{data.stats.wins === 1 ? "" : "s"}
					({data.stats.attempts} attempt{data.stats.attempts === 1 ? "" : "s"}).
					{#if challenge.type === CHALLENGE_TYPES.RECOVERY && data.stats.bestMoveCount != null}
						Best: {data.stats.bestMoveCount} move{data.stats.bestMoveCount === 1 ? "" : "s"}.
					{:else if challenge.type === CHALLENGE_TYPES.TIME && data.stats.bestElapsedMs != null}
						Best time: {formatChallengeElapsedMs(data.stats.bestElapsedMs)}.
					{/if}
				{:else if data.stats.attempts > 0}
					{data.stats.attempts} attempt{data.stats.attempts === 1 ? "" : "s"} so far — keep going!
				{:else}
					No attempts yet.
				{/if}
			</p>
		{/if}

		{#if data.isPro}
			<form method="POST" action="?/start" use:enhance={onStart}>
				<Button type="submit" class="w-full justify-center" disabled={starting}>
					{starting ? "Starting…" : "Start Challenge"}
				</Button>
			</form>
		{:else}
			<div
				class="rounded-lg p-4 text-center"
				style:background-color={page.data.theme?.boardBackground}
			>
				<p class="mb-3 text-sm" style:color={page.data.theme?.textDark}>
					{#if data.user}
						Upgrade to Pro to play daily challenges.
					{:else}
						Log in and upgrade to Pro to play daily challenges.
					{/if}
				</p>
				{#if data.user}
					<Button href="/stripe" class="justify-center gap-2">
						<CrownIcon size={20} />
						Upgrade to Pro
					</Button>
				{:else}
					<Button href="/login?redirectTo=/challenges/{challenge.id}" class="justify-center">
						Log in
					</Button>
				{/if}
			</div>
		{/if}

		<a
			href={leaderboardHref}
			class="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:brightness-95"
			style:background-color={page.data.theme?.boardBackground}
			style:color={page.data.theme?.textDark}
		>
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
			>
				<TrophyIcon size={20} />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-bold tracking-wide uppercase opacity-80"
					>Global leaderboard</span
				>
				{#if data.userRank != null && data.userBestScore != null}
					<span class="block text-base font-semibold">
						Your rank: #{data.userRank}
						{#if data.entryCount > 0}
							<span class="font-normal opacity-80">of {data.entryCount}</span>
						{/if}
						<span class="font-normal opacity-80">
							· {formatChallengeRankValue(challenge.type, data.userBestScore)}
							{#if challenge.type === CHALLENGE_TYPES.RECOVERY}
								moves
							{/if}
						</span>
					</span>
				{:else if data.entryCount > 0}
					<span class="block text-base font-semibold">
						{data.entryCount} clear{data.entryCount === 1 ? "" : "s"} — tap to view
					</span>
				{:else}
					<span class="block text-base font-semibold">No clears yet — be the first</span>
				{/if}
			</span>
			<ChevronRightIcon size={20} class="shrink-0 opacity-70" />
		</a>
	{/if}
</main>
