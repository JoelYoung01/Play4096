<script>
	import { USER_LEVELS } from "$lib/constants";
	import { Button } from "$lib/components/ui/button/index.js";
	import { PlayIcon } from "@lucide/svelte";

	let { data } = $props();

	/**
	 * @param {Date | string | null} value
	 */
	function formatDate(value) {
		if (!value) return "—";
		const date = value instanceof Date ? value : new Date(value);
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	}

	/**
	 * Build a history URL preserving other query params
	 * @param {{ sort?: string, filter?: string }} updates
	 */
	function historyHref(updates) {
		const sort = updates.sort ?? data.sort;
		const filter = updates.filter ?? data.filter;
		return `/replay?sort=${encodeURIComponent(sort)}&filter=${encodeURIComponent(filter)}`;
	}
</script>

<svelte:head>
	<title>Game History - 4096</title>
	<meta name="description" content="Browse and replay your completed 4096 games." />
</svelte:head>

<main class="mx-auto w-full max-w-lg px-6 pt-10 pb-28 text-foreground">
	<h1 class="text-3xl font-bold text-primary">Game History</h1>
	<p class="mb-4 text-sm text-muted-foreground">
		Finished games only — your current run lives on the Play page; history is
		for completed wins and losses you can replay move by move.
	</p>

	{#if !data.user}
		<div class="rounded-lg border border-dashed px-6 py-12 text-center">
			<p class="mb-1 font-semibold text-foreground">Sign in to view your history</p>
			<p class="mb-4 text-sm text-muted-foreground">
				Game history and replay are available for Pro players.
			</p>
			<Button href="/login?redirectTo=/replay" class="justify-center">Log in</Button>
		</div>
	{:else if data.user.level !== USER_LEVELS.PRO}
		<div
			class="rounded-lg border border-dashed border-primary/30 bg-primary/10 px-6 py-12 text-center"
		>
			<p class="mb-1 font-semibold text-foreground">Pro feature</p>
			<p class="mb-4 text-sm text-muted-foreground">
				Upgrade to Pro to browse past games and watch move-by-move replays.
			</p>
			<Button href="/stripe" class="justify-center">Upgrade to Pro</Button>
		</div>
	{:else}
		<div class="mb-4 flex flex-wrap gap-2">
			<div class="flex flex-1 gap-1 rounded-md bg-muted p-1">
				{#each [{ key: "all", label: "All" }, { key: "won", label: "Wins" }, { key: "lost", label: "Losses" }] as option (option.key)}
					<a
						href={historyHref({ filter: option.key })}
						class="flex-1 rounded px-2 py-1.5 text-center text-sm font-semibold transition-colors {data.filter ===
						option.key
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-background'}"
					>
						{option.label}
					</a>
				{/each}
			</div>
		</div>

		<div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
			<span class="shrink-0">Sort:</span>
			{#each [{ key: "date", label: "Date" }, { key: "score", label: "Score" }, { key: "moves", label: "Moves" }] as option (option.key)}
				<a
					href={historyHref({ sort: option.key })}
					class="rounded px-2 py-1 font-medium {data.sort === option.key
						? 'bg-secondary text-secondary-foreground'
						: 'hover:bg-muted'}"
				>
					{option.label}
				</a>
			{/each}
		</div>

		{#if data.games.length === 0}
			<div class="rounded-lg border border-dashed px-6 py-12 text-center">
				<p class="mb-1 font-semibold text-foreground">No completed games yet</p>
				<p class="mb-4 text-sm text-muted-foreground">
					Finish a game (win or lose) and it will show up here for replay.
				</p>
				<Button href="/game" class="justify-center">Play a game</Button>
			</div>
		{:else}
			<ul class="space-y-2">
				{#each data.games as game (game.id)}
					<li
						class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground"
					>
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold {game.won
								? 'bg-green-100 text-green-700'
								: 'bg-red-100 text-red-700'}"
						>
							{game.won ? "WIN" : "LOSS"}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline gap-2">
								<span class="text-lg font-bold">{game.score.toLocaleString()}</span>
								<span class="text-xs text-muted-foreground">{game.moveCount} moves</span>
							</div>
							<div class="truncate text-xs text-muted-foreground">
								{formatDate(game.completedOn ?? game.updatedOn)}
							</div>
						</div>
						{#if game.hasReplay}
							<Button href="/replay/{game.id}" class="gap-1" aria-label="Replay game">
								<PlayIcon size={16} />
								Replay
							</Button>
						{:else}
							<span
								class="text-xs text-muted-foreground/70"
								title="Move list unavailable for this game"
							>
								No replay
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</main>
