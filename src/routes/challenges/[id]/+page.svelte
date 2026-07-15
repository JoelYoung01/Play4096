<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import BoardPreview from "$lib/components/BoardPreview.svelte";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		formatChallengeTypeLabel,
	} from "$lib/challenges.js";
	import { CrownIcon, ArrowLeftIcon } from "@lucide/svelte";

	let { data } = $props();

	let starting = $state(false);

	const challenge = $derived(data.challenge);
	const typeLabel = $derived(formatChallengeTypeLabel(challenge.type));

	const previewBoard = $derived(
		!data.locked && "board" in challenge.params && Array.isArray(challenge.params.board)
			? challenge.params.board
			: null
	);

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

<main class="mx-auto w-full max-w-lg px-4 pt-8 pb-28" style:color={page.data.theme?.text}>
	<a
		href="/challenges"
		class="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
	>
		<ArrowLeftIcon size={16} />
		Calendar
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
	<h1 class="text-3xl font-bold text-[var(--color-primary)]">{challenge.title}</h1>

	{#if data.locked}
		<div
			class="mt-6 rounded-lg p-4 text-center"
			style:background-color={page.data.theme?.boardBackground}
		>
			<p class="mb-3 text-sm" style:color={page.data.theme?.textDark}>
				Past daily challenges are a Pro feature — same archive pattern as game history.
			</p>
			{#if data.user}
				<Btn href="/stripe" class="justify-center gap-2">
					<CrownIcon size={20} />
					Upgrade to Pro
				</Btn>
			{:else}
				<Btn href="/login?redirectTo=/challenges/{challenge.id}" class="justify-center">Log in</Btn>
			{/if}
		</div>
	{:else}
		<p class="mb-1 text-sm text-gray-500">{challenge.difficulty} · {typeLabel}</p>
		<p class="mb-6 text-base">{data.overview}</p>

		{#if previewBoard && page.data.theme}
			<div class="mb-6">
				<p class="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Starting board</p>
				<BoardPreview theme={page.data.theme} board={previewBoard} />
			</div>
		{/if}

		{#if data.stats}
			<p class="mb-4 text-sm text-gray-500">
				{#if data.stats.bestStatus === CHALLENGE_RUN_STATUS.WON}
					You've cleared this challenge {data.stats.wins} time{data.stats.wins === 1 ? "" : "s"}
					({data.stats.attempts} attempt{data.stats.attempts === 1 ? "" : "s"}).
					{#if challenge.type === CHALLENGE_TYPES.RECOVERY && data.stats.bestMoveCount != null}
						Best: {data.stats.bestMoveCount} move{data.stats.bestMoveCount === 1 ? "" : "s"}.
					{:else if challenge.type === CHALLENGE_TYPES.TIME && data.stats.bestScore != null}
						Best score: {data.stats.bestScore.toLocaleString()}.
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
				<Btn type="submit" class="w-full justify-center" disabled={starting}>
					{starting ? "Starting…" : "Start Challenge"}
				</Btn>
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
					<Btn href="/stripe" class="justify-center gap-2">
						<CrownIcon size={20} />
						Upgrade to Pro
					</Btn>
				{:else}
					<Btn href="/login?redirectTo=/challenges/{challenge.id}" class="justify-center"
						>Log in</Btn
					>
				{/if}
			</div>
		{/if}

		<section class="mt-8">
			<div class="mb-3 flex items-baseline justify-between gap-2">
				<h2 class="text-lg font-bold text-[var(--color-primary)]">Global leaderboard</h2>
				{#if data.dateStr}
					<a
						href="/leaderboard/daily?date={data.dateStr}"
						class="text-xs font-semibold text-[var(--color-primary)] hover:underline"
					>
						View full board
					</a>
				{/if}
			</div>
			<p class="mb-3 text-xs text-gray-500">
				{#if challenge.type === CHALLENGE_TYPES.RECOVERY}
					Best clear by moves (fewer is better).
				{:else}
					Best clear by score (higher is better).
				{/if}
			</p>
			{#if data.leaderboard.length === 0}
				<p class="rounded-lg bg-gray-100 px-4 py-6 text-center text-sm text-gray-600">
					No clears yet — be the first!
				</p>
			{:else}
				{@const scoreLabel = challenge.type === CHALLENGE_TYPES.RECOVERY ? "Moves" : "Score"}
				{@const showUserRow =
					data.userRank != null &&
					data.userBestScore != null &&
					!data.leaderboard.some((l) => l.id === data.user?.id)}
				<table class="w-full border-collapse overflow-hidden rounded-lg">
					<thead>
						<tr class="bg-[var(--color-secondary)] text-gray-700">
							<th class="px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Rank</th
							>
							<th class="px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase"
								>Player</th
							>
							<th class="px-3 py-2 text-end text-xs font-semibold tracking-wide uppercase"
								>{scoreLabel}</th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.leaderboard as entry, index (entry.id)}
							<tr
								class="transition-colors hover:bg-green-200 {index % 2 === 0
									? 'bg-gray-200'
									: 'bg-gray-100'}"
							>
								<td class="w-12 px-3 py-2 text-sm font-semibold text-gray-700"># {index + 1}</td>
								<td class="px-3 py-2 text-sm font-medium text-gray-700">
									{entry.displayName || entry.username}
									{#if entry.id === data.user?.id}
										<span class="text-xs text-gray-500">You</span>
									{/if}
								</td>
								<td class="px-3 py-2 text-end text-sm font-bold text-gray-700">
									{entry.bestScore?.toLocaleString()}
								</td>
							</tr>
						{/each}
						{#if showUserRow}
							<tr class="bg-gray-200">
								<td colspan="3" class="text-center text-sm font-bold text-gray-700">...</td>
							</tr>
							<tr class="bg-gray-100">
								<td class="px-3 py-2 text-sm font-semibold text-gray-700"># {data.userRank}</td>
								<td class="px-3 py-2 text-sm font-medium text-gray-700">
									{data.user?.displayName || data.user?.username}
								</td>
								<td class="px-3 py-2 text-end text-sm font-bold text-gray-700">
									{data.userBestScore?.toLocaleString()}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			{/if}
		</section>
	{/if}
</main>
