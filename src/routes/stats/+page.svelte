<script>
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { defaultTheme } from "$lib/assets/themes.js";
	import { BOARD_GAP, BOARD_PADDING, TILE_BORDER_RADIUS } from "$lib/boardConstants.js";
	import { formatChallengeElapsedMs } from "$lib/challenges.js";
	import { DEFAULT_BOARD_SIZE, USER_LEVELS } from "$lib/constants";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getTileBackground, getTileColor } from "$lib/game.svelte.js";

	let { data } = $props();

	let theme = $derived(page.data.theme || defaultTheme);

	/** Game page `.game-container` chrome used to derive live board cell size. */
	const GAME_CONTAINER_MAX_WIDTH = 500;
	const GAME_CONTAINER_PADDING_X = 40;

	/**
	 * Board cell size for the current viewport — same geometry as AnimatedBoard
	 * inside `.game-container` (max-width 500px, 20px horizontal padding).
	 * @param {number} viewportWidth
	 */
	function boardCellSize(viewportWidth) {
		const boardWidth = Math.min(GAME_CONTAINER_MAX_WIDTH, viewportWidth) - GAME_CONTAINER_PADDING_X;
		return (
			(boardWidth - BOARD_PADDING * 2 - BOARD_GAP * (DEFAULT_BOARD_SIZE - 1)) / DEFAULT_BOARD_SIZE
		);
	}

	/** Mirrors AnimatedBoard's `window.innerWidth <= 600` breakpoint. */
	let isMobileViewport = $state(browser ? window.innerWidth <= 600 : true);
	/** Keep the stats tile pixel-identical to a live board cell. */
	let statsTileSize = $state(browser ? boardCellSize(window.innerWidth) : 75);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia("(max-width: 600px)");
		const sync = () => {
			isMobileViewport = mq.matches;
			statsTileSize = boardCellSize(window.innerWidth);
		};
		sync();
		mq.addEventListener("change", sync);
		window.addEventListener("resize", sync);
		return () => {
			mq.removeEventListener("change", sync);
			window.removeEventListener("resize", sync);
		};
	});

	/**
	 * Exact font-size formula from AnimatedBoard / BasicBoard.
	 * @param {number} value
	 */
	function getTileFontSize(value) {
		const baseSize = isMobileViewport ? 2.5 : (theme.textScale ?? 3);
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}

	/**
	 * @param {number | null | undefined} value
	 * @param {{ suffix?: string; fallback?: string }} [options]
	 */
	function formatNumber(value, options = {}) {
		const fallback = options.fallback ?? "—";
		if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
		const formatted = value.toLocaleString();
		return options.suffix ? `${formatted}${options.suffix}` : formatted;
	}

	/**
	 * Classic win duration from created → completed (wall clock).
	 * @param {number | null | undefined} ms
	 */
	function formatWinDuration(ms) {
		if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
		const totalSec = Math.floor(ms / 1000);
		if (totalSec < 60) return `${totalSec}s`;
		const minutes = Math.floor(totalSec / 60);
		const seconds = totalSec % 60;
		if (minutes < 60) {
			return `${minutes}:${String(seconds).padStart(2, "0")}`;
		}
		const hours = Math.floor(minutes / 60);
		const remMin = minutes % 60;
		return `${hours}h ${remMin}m`;
	}

	/**
	 * @param {number | null | undefined} wins
	 * @param {number | null | undefined} losses
	 */
	function formatRecord(wins, losses) {
		const w = typeof wins === "number" ? wins : 0;
		const l = typeof losses === "number" ? losses : 0;
		return `${w}–${l}`;
	}
</script>

<svelte:head>
	<title>Play Stats - 4096</title>
	<meta
		name="description"
		content="Your 4096 play stats — highest tile, fastest wins, challenge ranks, and more."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-lg px-6 pt-10 pb-28 text-foreground">
	<h1 class="text-3xl font-bold text-primary">Play Stats</h1>
	<p class="mb-6 text-sm text-muted-foreground">
		Personal records from your classic games and daily challenges.
	</p>

	{#if !data.user}
		<div class="rounded-lg border border-dashed px-6 py-12 text-center">
			<p class="mb-1 font-semibold text-foreground">Sign in to view your stats</p>
			<p class="mb-4 text-sm text-muted-foreground">
				Play stats are available for Pro players with a game history.
			</p>
			<Button href="/login?redirectTo=/stats" class="justify-center">Log in</Button>
		</div>
	{:else if data.user.level !== USER_LEVELS.PRO}
		<div
			class="rounded-lg border border-dashed border-primary/30 bg-primary/10 px-6 py-12 text-center"
		>
			<p class="mb-1 font-semibold text-foreground">Pro feature</p>
			<p class="mb-4 text-sm text-muted-foreground">
				Upgrade to Pro to unlock play stats, game history, and daily challenge archives.
			</p>
			<Button href="/stripe" class="justify-center">Upgrade to Pro</Button>
		</div>
	{:else if data.stats}
		{@const stats = data.stats}

		{#if stats.totalGames === 0 && stats.challengeAttempts === 0}
			<div class="mb-6 rounded-lg border border-dashed px-6 py-12 text-center">
				<p class="mb-1 font-semibold text-foreground">No games yet</p>
				<p class="mb-4 text-sm text-muted-foreground">
					Play a classic game or today's challenge — your records will show up here.
				</p>
				<div class="flex flex-wrap justify-center gap-2">
					<Button href="/game" class="justify-center">Play classic</Button>
					<Button href="/challenges" variant="secondary" class="justify-center">
						Daily challenges
					</Button>
				</div>
			</div>
		{/if}

		<section class="mb-8">
			<h2 class="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">Classic</h2>
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Highest tile
					</p>
					{#if stats.highestTile > 0}
						<div
							class="stats-tile mt-2"
							style:width={`${statsTileSize}px`}
							style:height={`${statsTileSize}px`}
							style:background={getTileBackground(stats.highestTile, theme)}
							style:color={getTileColor(stats.highestTile, theme)}
							style:border-radius={`${TILE_BORDER_RADIUS}px`}
							style:font-size={getTileFontSize(stats.highestTile)}
							aria-label={`Highest tile ${stats.highestTile}`}
						>
							{stats.highestTile}
						</div>
					{:else}
						<p class="mt-1 text-2xl font-bold tabular-nums">—</p>
					{/if}
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Best score
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.bestScore)}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Least moves to win
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.leastMovesToWin)}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Fastest win
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatWinDuration(stats.fastestWinMs)}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">Wall-clock start → finish</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Win / loss
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatRecord(stats.wins, stats.losses)}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{stats.winRate != null ? `${stats.winRate}% win rate` : "No finished games"}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Games played
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.totalGames, { fallback: "0" })}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{stats.completedGames} finished{#if stats.activeGames > 0}
							<span aria-hidden="true"> · </span>{stats.activeGames} active{/if}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Avg score
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.averageScore)}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">Finished games</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Total moves
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.totalMoves, { fallback: "0" })}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{stats.averageMovesPerWin != null
							? `Avg ${stats.averageMovesPerWin.toLocaleString()} / win`
							: "Across all runs"}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Win streak
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.currentWinStreak, { fallback: "0" })}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						Best {formatNumber(stats.longestWinStreak, { fallback: "0" })}
					</p>
				</div>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
				Daily challenges
			</h2>
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Avg daily rank
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{stats.averageDailyChallengeRank != null ? `#${stats.averageDailyChallengeRank}` : "—"}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{stats.rankedChallengeClears > 0
							? `Across ${stats.rankedChallengeClears} clear${stats.rankedChallengeClears === 1 ? "" : "s"}`
							: "Win a challenge to rank"}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Challenge record
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatRecord(stats.challengeWins, stats.challengeLosses)}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{stats.challengeWinRate != null
							? `${stats.challengeWinRate}% clear rate`
							: "No finishes yet"}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Best time clear
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatChallengeElapsedMs(stats.bestChallengeElapsedMs)}
					</p>
				</div>
				<div class="rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Best recovery
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{stats.bestChallengeMoveCount != null
							? `${stats.bestChallengeMoveCount.toLocaleString()} moves`
							: "—"}
					</p>
				</div>
				<div class="col-span-2 rounded-xl bg-muted/60 p-4 ring-1 ring-border/40">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Challenge attempts
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">
						{formatNumber(stats.challengeAttempts, { fallback: "0" })}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						Includes in-progress runs; abandoned retries are excluded
					</p>
				</div>
			</div>
		</section>
	{/if}
</main>

<style>
	/* Match AnimatedBoard / BasicBoard `.tile` text rendering */
	.stats-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		text-align: center;
		padding: 0.2em;
		line-height: 1;
		flex: 0 0 auto;
		overflow: hidden;
		box-sizing: border-box;
	}
</style>
