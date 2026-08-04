<script>
	import { page } from "$app/state";
	import { getInkColor } from "$lib/assets/themes.js";

	/**
	 * Themed stat cards shared by the end-game dialogs (win, game over,
	 * challenge results). Extracted from the You Won dialog.
	 *
	 * @typedef {Object} GameStat
	 * @property {string} label
	 * @property {string} value
	 * @property {boolean} [newBest] Show a "New Best!" badge on this stat
	 */

	/** @type {{ stats: GameStat[], label?: string }} */
	let { stats, label = "Game stats" } = $props();

	const theme = $derived(page.data.theme);
	// Readable ink for the board-colored stat cards
	const boardInk = $derived(theme ? getInkColor(theme.boardBackground, theme) : "#f9f6f2");
</script>

<div class="game-stats" role="group" aria-label={label} style:--stat-columns={stats.length}>
	{#each stats as stat (stat.label)}
		<div class="game-stat" style:background-color={theme?.boardBackground} style:color={boardInk}>
			{#if stat.newBest}
				<span class="game-stat-badge">New Best!</span>
			{/if}
			<span class="game-stat-label">{stat.label}</span>
			<span class="game-stat-value">{stat.value}</span>
		</div>
	{/each}
</div>

<style>
	.game-stats {
		display: grid;
		grid-template-columns: repeat(var(--stat-columns, 3), minmax(0, 1fr));
		gap: 0.5rem;
		margin: 1.25rem 0 1.5rem;
	}

	.game-stat {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		padding: 0.65rem 0.5rem;
		border-radius: 0.5rem;
		min-width: 0;
	}

	.game-stat-badge {
		position: absolute;
		top: -0.55rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.16rem 0.45rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		color: #451a03;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow: var(--shadow-pop);
		animation: game-stat-badge-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 250ms both;
	}

	@keyframes game-stat-badge-pop {
		from {
			opacity: 0;
			transform: translateX(-50%) scale(0.5);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.game-stat-badge {
			animation: none;
		}
	}

	.game-stat-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.game-stat-value {
		font-size: 1.15rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
</style>
