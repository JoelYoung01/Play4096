<script>
	import { page } from "$app/state";
	import { CHALLENGE_RUN_STATUS, formatChallengeTypeLabel } from "$lib/challenges.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { CrownIcon, ChevronLeftIcon, ChevronRightIcon } from "@lucide/svelte";

	let { data } = $props();

	const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

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
	 * @param {{ status: string | null; isToday: boolean }} day
	 */
	function dayBackground(day) {
		if (day.status === CHALLENGE_RUN_STATUS.WON) return "#16a34a";
		if (day.status === CHALLENGE_RUN_STATUS.LOST) return "#dc2626";
		if (day.isToday) return page.data.theme?.primary;
		return page.data.theme?.boardBackground;
	}

	/**
	 * @param {{ status: string | null; isToday: boolean }} day
	 */
	function dayColor(day) {
		if (day.status === CHALLENGE_RUN_STATUS.WON || day.status === CHALLENGE_RUN_STATUS.LOST) {
			return "#ffffff";
		}
		return page.data.theme?.textDark;
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
			style:background-color={page.data.theme?.boardBackground}
			style:color={page.data.theme?.textDark}
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
		<div
			class="mb-5 rounded-lg p-4 text-center"
			style:background-color={page.data.theme?.boardBackground}
		>
			<p class="mb-3 text-sm" style:color={page.data.theme?.textDark}>
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
						style:background-color={page.data.theme?.boardBackground}
						style:color={page.data.theme?.textDark}
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
						)} flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
						class:today={day.isToday}
						style:background-color={dayBackground(day)}
						style:color={dayColor(day)}
						aria-label={`${day.dateStr}${day.status === CHALLENGE_RUN_STATUS.WON ? ", cleared" : day.status === CHALLENGE_RUN_STATUS.LOST ? ", failed" : ""}`}
					>
						<span>{day.day}</span>
					</a>
				{/if}
			{/each}
		</div>

		<div class="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
			<span class="inline-flex items-center gap-1.5">
				<span class="swatch won-swatch"></span> Cleared
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span class="swatch lost-swatch"></span> Failed
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
		display: inline-block;
	}

	.won-swatch {
		background: #16a34a;
	}

	.lost-swatch {
		background: #dc2626;
	}

	.day.today {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 55%, transparent);
	}
</style>
