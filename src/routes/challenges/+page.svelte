<script>
	import { page } from "$app/state";
	import { getInkColor } from "$lib/assets/themes.js";
	import { CHALLENGE_RUN_STATUS, formatChallengeTypeLabel } from "$lib/challenges.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { CrownIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, XIcon } from "@lucide/svelte";

	let { data } = $props();

	const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

	let theme = $derived(page.data.theme);
	// Readable ink for board-colored surfaces (locked days, pro upsell)
	let boardInk = $derived(theme ? getInkColor(theme.boardBackground, theme) : "#f9f6f2");
	let todayCardBg = $derived(theme?.challengeToday ?? theme?.boardBackground);
	let todayCardInk = $derived(
		theme && todayCardBg ? getInkColor(todayCardBg, theme) : boardInk
	);

	/**
	 * @param {string | null} status
	 */
	function statusClass(status) {
		if (status === CHALLENGE_RUN_STATUS.WON) return "won";
		if (status === CHALLENGE_RUN_STATUS.LOST) return "lost";
		if (status === CHALLENGE_RUN_STATUS.IN_PROGRESS) return "progress";
		return "";
	}

	/**
	 * Background for a calendar day cell. Status colors fill the whole day
	 * so cleared/failed days stay readable on the brand primary (today).
	 * Won / lost colors come from the active theme so they stay distinct from
	 * `primary` (today) for common color-vision deficiencies.
	 * @param {{ status: string | null; isToday: boolean }} day
	 */
	function dayBackground(day) {
		if (day.status === CHALLENGE_RUN_STATUS.WON) return theme?.challengeWon;
		if (day.status === CHALLENGE_RUN_STATUS.LOST) return theme?.challengeLost;
		if (day.isToday) return theme?.primary;
		return theme?.boardBackground;
	}

	/**
	 * Readable ink for a theme surface: Classic keeps its historical
	 * light-on-board look, other themes pick the higher-contrast ink.
	 * @param {string | undefined} bg
	 */
	function statusInk(bg) {
		if (!bg || !theme) return "#f9f6f2";
		return getInkColor(bg, theme);
	}

	/**
	 * @param {{ status: string | null; isToday: boolean }} day
	 */
	function dayColor(day) {
		return statusInk(dayBackground(day));
	}
</script>

<svelte:head>
	<title>Daily Challenges - 4096</title>
	<meta
		name="description"
		content="A new daily challenge every midnight Central Time. Pro unlocks the calendar archive."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 pt-8 pb-28 text-foreground">
	<h1 class="text-3xl font-bold text-primary">Daily Challenges</h1>
	<p class="mb-5 text-sm text-muted-foreground">
		A fresh challenge every midnight Central Time ({data.timezone.replace("_", " ")}).
	</p>

	{#if data.todayChallenge}
		<section
			class="mb-6 rounded-xl p-4"
			style:background-color={todayCardBg}
			style:color={todayCardInk}
		>
			<p class="mb-1 text-xs font-bold tracking-wide uppercase opacity-70">Today · {data.today}</p>
			<h2 class="text-xl font-bold">{data.todayChallenge.title}</h2>
			<p class="mb-1 text-sm opacity-80">
				{formatChallengeTypeLabel(data.todayChallenge.type)} · {data.todayChallenge.difficulty}
			</p>
			<p class="mb-3 text-sm opacity-90">{data.todayChallenge.objective}</p>
			<Button href="/challenges/{data.todayChallenge.id}" class="w-full justify-center">
				{data.isPro ? "Play today's challenge" : "View today's challenge"}
			</Button>
		</section>
	{/if}

	{#if !data.isPro}
		<div class="mb-5 rounded-lg p-4 text-center" style:background-color={theme?.boardBackground}>
			<p class="mb-3 text-sm" style:color={boardInk}>
				Browse today's challenge below. Starting any challenge — and opening past days — requires
				Pro.
			</p>
			<Button href="/stripe" class="justify-center gap-2">
				<CrownIcon size={20} />
				Upgrade to Pro
			</Button>
		</div>
	{/if}

	<section class="calendar">
		<div class="mb-3 flex items-center justify-between">
			<Button
				href={data.calendar.prevHref}
				variant="secondary"
				size="icon-sm"
				aria-label="Previous month"
			>
				<ChevronLeftIcon size={20} />
			</Button>
			<h2 class="text-lg font-bold">{data.calendar.monthLabel}</h2>
			{#if data.calendar.nextHref}
				<Button
					href={data.calendar.nextHref}
					variant="secondary"
					size="icon-sm"
					aria-label="Next month"
				>
					<ChevronRightIcon size={20} />
				</Button>
			{:else}
				<span class="inline-flex rounded-md p-2 opacity-30" aria-hidden="true">
					<ChevronRightIcon size={20} />
				</span>
			{/if}
		</div>

		<div
			class="weekday-row mb-1 grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground"
		>
			{#each weekdays as label, i (i)}
				<span>{label}</span>
			{/each}
		</div>

		<div
			class="grid grid-cols-7 gap-1"
			style:grid-template-rows={`repeat(${Math.ceil((data.calendar.startWeekday + data.calendar.days.length) / 7)}, minmax(0, 1fr))`}
		>
			{#each Array.from({ length: data.calendar.startWeekday }, (_, i) => i) as blankIndex (blankIndex)}
				<span class="aspect-square"></span>
			{/each}

			{#each data.calendar.days as day (day.dateStr)}
				{#if day.isFuture}
					<span
						class="day future flex aspect-square flex-col items-center justify-center rounded-lg text-sm text-muted-foreground/60"
					>
						{day.day}
					</span>
				{:else if day.locked}
					<a
						href="/stripe"
						class="day locked flex aspect-square flex-col items-center justify-center rounded-lg text-sm"
						style:background-color={theme?.boardBackground}
						style:color={boardInk}
						title="Pro unlocks past challenges"
					>
						<span class="font-semibold">{day.day}</span>
						<CrownIcon size={12} class="opacity-70" />
					</a>
				{:else}
					<a
						href="/challenges/{day.id}"
						class="day {statusClass(
							day.status
						)} flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
						class:today={day.isToday}
						style:background-color={dayBackground(day)}
						style:color={dayColor(day)}
						aria-label={`${day.dateStr}${day.isToday ? ", today" : ""}${day.status === CHALLENGE_RUN_STATUS.WON ? ", cleared" : day.status === CHALLENGE_RUN_STATUS.LOST ? ", failed" : ""}`}
					>
						<span>{day.day}</span>
						{#if day.status === CHALLENGE_RUN_STATUS.WON}
							<CheckIcon size={11} strokeWidth={3} aria-hidden="true" />
						{:else if day.status === CHALLENGE_RUN_STATUS.LOST}
							<XIcon size={11} strokeWidth={3} aria-hidden="true" />
						{/if}
					</a>
				{/if}
			{/each}
		</div>

		<div class="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
			<span class="inline-flex items-center gap-1.5">
				<span
					class="swatch"
					style:background-color={theme?.primary}
					style:box-shadow="0 0 0 2px color-mix(in srgb, {theme?.primary ?? '#000'} 70%, transparent)"
				></span>
				Today
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span
					class="swatch"
					style:background-color={theme?.challengeWon}
					style:color={statusInk(theme?.challengeWon)}
				>
					<CheckIcon size={8} strokeWidth={3} aria-hidden="true" />
				</span>
				Cleared
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span
					class="swatch"
					style:background-color={theme?.challengeLost}
					style:color={statusInk(theme?.challengeLost)}
				>
					<XIcon size={8} strokeWidth={3} aria-hidden="true" />
				</span>
				Failed
			</span>
			{#if !data.isPro}
				<span class="inline-flex items-center gap-1">
					<CrownIcon size={12} /> Past days (Pro)
				</span>
			{/if}
		</div>
	</section>
</main>

<style>
	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.day.today {
		box-shadow:
			0 0 0 2px var(--background),
			0 0 0 4px color-mix(in srgb, var(--primary) 85%, var(--foreground));
	}
</style>
