<script>
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		countFilledCells,
		resolveClearTarget,
	} from "$lib/challenges.js";
	import { CrownIcon, ArrowLeftIcon } from "@lucide/svelte";

	let { data } = $props();

	let starting = $state(false);

	const challenge = $derived(data.challenge);

	const previewBoard = $derived(
		"board" in challenge.params && Array.isArray(challenge.params.board)
			? challenge.params.board
			: null
	);

	/**
	 * @param {any} event
	 */
	function onStart() {
		starting = true;
		return async ({ update }) => {
			await update();
			starting = false;
		};
	}
</script>

<svelte:head>
	<title>{challenge.title} - Challenges - 4096</title>
</svelte:head>

<main class="mx-auto mt-8 mb-[5rem] w-full max-w-lg p-6" style:color={page.data.theme?.text}>
	<a
		href="/challenges"
		class="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
	>
		<ArrowLeftIcon size={16} />
		All challenges
	</a>

	<h1 class="text-3xl font-bold text-[var(--color-primary)]">{challenge.title}</h1>
	<p class="mb-1 text-sm text-gray-500">{challenge.difficulty} · {data.objective}</p>
	<p class="mb-6">{challenge.description}</p>

	{#if challenge.type === CHALLENGE_TYPES.TIME}
		<ul class="mb-6 list-inside list-disc text-sm text-gray-600">
			<li>Target score: {challenge.params.targetScore.toLocaleString()}</li>
			<li>Time limit: {challenge.params.durationSec}s</li>
			<li>Fail if the timer runs out or you game over first</li>
		</ul>
	{:else if challenge.type === CHALLENGE_TYPES.CLEAR}
		<ul class="mb-6 list-inside list-disc text-sm text-gray-600">
			<li>Starting tiles: {countFilledCells(challenge.params.board)}</li>
			<li>Clear to ≤ {resolveClearTarget(challenge.params)} occupied cells</li>
			<li>Fail on game over before reaching the target</li>
		</ul>
	{:else}
		<ul class="mb-6 list-inside list-disc text-sm text-gray-600">
			<li>Goal tile: {challenge.params.winTile ?? 4096}</li>
			<li>Start from the preset board below</li>
			<li>Fail on game over</li>
		</ul>
	{/if}

	{#if previewBoard}
		<div class="mb-6">
			<p class="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Starting board</p>
			<div
				class="grid aspect-square grid-cols-4 gap-2 rounded-lg p-2"
				style:background-color={page.data.theme?.boardBackground}
			>
				{#each previewBoard as row, ri (ri)}
					{#each row as cell, ci (ci)}
						<div
							class="flex items-center justify-center rounded text-sm font-bold"
							style:background-color={cell
								? (page.data.theme?.tiles?.[cell] ?? page.data.theme?.unknownTile)
								: page.data.theme?.emptyTile}
							style:color={page.data.theme?.textDark}
						>
							{cell || ""}
						</div>
					{/each}
				{/each}
			</div>
		</div>
	{/if}

	{#if data.stats}
		<p class="mb-4 text-sm text-gray-500">
			{#if data.stats.bestStatus === CHALLENGE_RUN_STATUS.WON}
				You've cleared this challenge {data.stats.wins} time{data.stats.wins === 1 ? "" : "s"}
				({data.stats.attempts} attempt{data.stats.attempts === 1 ? "" : "s"}).
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
					Upgrade to Pro to play this challenge.
				{:else}
					Log in and upgrade to Pro to play this challenge.
				{/if}
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
	{/if}
</main>
