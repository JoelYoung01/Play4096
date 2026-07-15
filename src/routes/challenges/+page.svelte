<script>
	import { page } from "$app/state";
	import Btn from "$lib/components/Btn.svelte";
	import { CHALLENGE_RUN_STATUS, CHALLENGE_TYPES } from "$lib/challenges.js";
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
	 * @param {string} type
	 */
	function typeLabel(type) {
		if (type === CHALLENGE_TYPES.TIME) return "Time";
		if (type === CHALLENGE_TYPES.CLEAR) return "Clear";
		return "Recovery";
	}
</script>

<svelte:head>
	<title>Daily Challenges - 4096</title>
	<meta
		name="description"
		content="A new daily challenge every midnight Central Time. Pro unlocks the calendar archive."
	/>
</svelte:head>

<main
	class="mx-auto h-full w-full max-w-lg overflow-y-auto px-4 pt-8 pb-28"
	style:color={page.data.theme?.text}
>
	<h1 class="text-3xl font-bold text-[var(--color-primary)]">Daily Challenges</h1>
	<p class="mb-5 text-sm text-gray-500">
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
				{typeLabel(data.todayChallenge.type)} · {data.todayChallenge.difficulty}
			</p>
			<p class="mb-3 text-sm opacity-90">{data.todayChallenge.objective}</p>
			<Btn href="/challenges/{data.todayChallenge.id}" class="w-full justify-center">
				{data.isPro ? "Play today's challenge" : "View today's challenge"}
			</Btn>
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
			<Btn href="/stripe" class="justify-center gap-2">
				<CrownIcon size={20} />
				Upgrade to Pro
			</Btn>
		</div>
	{/if}

	<section class="calendar">
		<div class="mb-3 flex items-center justify-between">
			<a
				href={data.calendar.prevHref}
				class="inline-flex rounded-md p-2 hover:opacity-80"
				style:background-color={page.data.theme?.boardBackground}
				aria-label="Previous month"
			>
				<ChevronLeftIcon size={20} />
			</a>
			<h2 class="text-lg font-bold">{data.calendar.monthLabel}</h2>
			{#if data.calendar.nextHref}
				<a
					href={data.calendar.nextHref}
					class="inline-flex rounded-md p-2 hover:opacity-80"
					style:background-color={page.data.theme?.boardBackground}
					aria-label="Next month"
				>
					<ChevronRightIcon size={20} />
				</a>
			{:else}
				<span class="inline-flex rounded-md p-2 opacity-30" aria-hidden="true">
					<ChevronRightIcon size={20} />
				</span>
			{/if}
		</div>

		<div
			class="weekday-row mb-1 grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500"
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
						class="day future flex aspect-square flex-col items-center justify-center rounded-lg text-sm text-gray-400"
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
						style:background-color={day.isToday
							? page.data.theme?.primary
							: page.data.theme?.boardBackground}
						style:color={day.isToday ? page.data.theme?.textDark : page.data.theme?.textDark}
					>
						<span>{day.day}</span>
						{#if day.status === CHALLENGE_RUN_STATUS.WON}
							<span class="dot won-dot"></span>
						{:else if day.status === CHALLENGE_RUN_STATUS.LOST}
							<span class="dot lost-dot"></span>
						{/if}
					</a>
				{/if}
			{/each}
		</div>

		<div class="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
			<span class="inline-flex items-center gap-1">
				<span class="dot won-dot inline-block"></span> Cleared
			</span>
			<span class="inline-flex items-center gap-1">
				<span class="dot lost-dot inline-block"></span> Attempted
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
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		margin-top: 2px;
	}

	.won-dot {
		background: #16a34a;
	}

	.lost-dot {
		background: #dc2626;
	}

	.day.today {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 40%, transparent);
	}
</style>
