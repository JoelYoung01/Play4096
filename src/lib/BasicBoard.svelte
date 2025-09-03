<script>
	import { getTileBackground, getTileColor } from "./game.svelte.js";
	import { defaultTheme } from "./assets/themes";
	import GameControls from "./GameControls.svelte";
	let { game, newGame } = $props();

	/**
	 * Continue playing after winning
	 */
	function continuePlaying() {
		game.canContinue = true;
	}

	/**
	 * Get the font size for a tile
	 * @param {number} value
	 * @param {typeof defaultTheme} theme
	 * @returns {string}
	 */
	function getTileFontSize(value, theme = defaultTheme) {
		const mobile = typeof window !== "undefined" && window.innerWidth <= 600;
		const baseSize = mobile ? 2.5 : theme.textScale;
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}
</script>

<GameControls {game} {newGame} {continuePlaying} />

<!-- Game Board -->
<div class="game-board">
	{#each game.board as row, rowIndex (rowIndex)}
		{#each row as cell, colIndex (colIndex)}
			{#if cell !== 0}
				<div
					class="tile"
					style:font-size={getTileFontSize(cell)}
					style:background={getTileBackground(cell)}
					style:color={getTileColor(cell)}
				>
					{cell}
				</div>
			{:else}
				<div class="tile empty"></div>
			{/if}
		{/each}
	{/each}
</div>

<style lang="postcss">
	.game-board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 10px;
		background: #bbada0;
		padding: 10px;
		border-radius: 8px;
		margin-bottom: 20px;
		aspect-ratio: 1;
	}

	.tile {
		--animation-duration: 0.1s;

		background: #cdc1b4;
		border-radius: 6px;
		display: flex;
		flex: 0 0 auto;
		overflow: hidden;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		color: #776e65;
		transition: all var(--animation-duration) ease-in;
		position: relative;
		white-space: normal;
		word-break: break-all;
		text-align: center;
		padding: 0.2em;

		&:not(.empty) {
			animation: tileAppear var(--animation-duration) ease-out;
		}
	}

	@keyframes tileAppear {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
	.tile.empty {
		background: #cdc1b4;
	}
</style>
