<script>
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import {
		CHALLENGE_RUN_STATUS,
		CHALLENGE_TYPES,
		formatChallengeObjective,
	} from "$lib/challenges.js";
	import { CrownIcon, TimerIcon, EraserIcon, LifeBuoyIcon } from "@lucide/svelte";

	let { data } = $props();

	/**
	 * @param {string} type
	 */
	function typeIcon(type) {
		if (type === CHALLENGE_TYPES.TIME) return TimerIcon;
		if (type === CHALLENGE_TYPES.CLEAR) return EraserIcon;
		return LifeBuoyIcon;
	}

	/**
	 * @param {string} type
	 */
	function typeLabel(type) {
		if (type === CHALLENGE_TYPES.TIME) return "Time";
		if (type === CHALLENGE_TYPES.CLEAR) return "Clear";
		return "Recovery";
	}

	/**
	 * @param {string} challengeId
	 */
	function statusLabel(challengeId) {
		const entry = data.stats?.[challengeId];
		if (!entry || !entry.bestStatus) return null;
		if (entry.bestStatus === CHALLENGE_RUN_STATUS.WON) {
			return entry.wins > 1 ? `Cleared ×${entry.wins}` : "Cleared";
		}
		return `${entry.attempts} attempt${entry.attempts === 1 ? "" : "s"}`;
	}
</script>

<svelte:head>
	<title>Challenges - 4096</title>
	<meta
		name="description"
		content="Pro challenge modes: race the clock, clear the board, or recover from a tough start."
	/>
</svelte:head>

<main class="mx-auto mt-8 mb-[5rem] w-full max-w-lg p-6" style:color={page.data.theme?.text}>
	<h1 class="text-3xl font-bold text-[var(--color-primary)]">Challenges</h1>
	<p class="mb-6 text-sm text-gray-500">
		Fixed starting setups with clear win/lose goals. A Pro feature.
	</p>

	{#if !data.isPro}
		<div
			class="mb-6 rounded-lg p-4 text-center"
			style:background-color={page.data.theme?.boardBackground}
		>
			<p class="mb-3 text-sm" style:color={page.data.theme?.textDark}>
				Browse the roster below. Starting a challenge requires Pro.
			</p>
			<Btn href="/stripe" class="justify-center gap-2">
				<CrownIcon size={20} />
				Upgrade to Pro
			</Btn>
		</div>
	{/if}

	<ul class="flex flex-col gap-3">
		{#each data.challenges as challenge (challenge.id)}
			{@const Icon = typeIcon(challenge.type)}
			<li>
				<a
					href="/challenges/{challenge.id}"
					class="block rounded-lg p-4 transition-opacity hover:opacity-90"
					style:background-color={page.data.theme?.boardBackground}
					style:color={page.data.theme?.textDark}
				>
					<div class="mb-1 flex items-center gap-2">
						<Icon size={18} />
						<span class="text-xs font-bold tracking-wide uppercase opacity-70">
							{typeLabel(challenge.type)} · {challenge.difficulty}
						</span>
					</div>
					<div class="flex items-start justify-between gap-2">
						<div>
							<h2 class="text-lg font-bold">{challenge.title}</h2>
							<p class="text-sm opacity-80">{formatChallengeObjective(challenge)}</p>
						</div>
						{#if statusLabel(challenge.id)}
							<span class="shrink-0 text-xs font-semibold">{statusLabel(challenge.id)}</span>
						{/if}
					</div>
				</a>
			</li>
		{/each}
	</ul>
</main>
