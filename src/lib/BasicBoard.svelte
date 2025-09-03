<script>
	import { page } from "$app/state";

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
	 * @returns {string}
	 */
	function getTileFontSize(value) {
		const mobile = typeof window !== "undefined" && window.innerWidth <= 600;
		const baseSize = mobile ? 2.5 : page.data.theme.textScale;
		const digits = value.toString().length;
		const fontSize = Math.max(baseSize - (digits - 1) * 0.3, 1);
		return `${fontSize}rem`;
	}

	/**
	 * Get the background color for a tile
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileBackground(value) {
		if (value in page.data.theme.tiles) return page.data.theme.tiles[value];
		return page.data.theme.unknownTile;
	}

	/**
	 * Get the color for a tile
	 * @param {number} value
	 * @returns {string}
	 */
	function getTileColor(value, threshold = 0.7) {
		// Get the background color for this tile
		const bg = getTileBackground(value);

		/**
		 * Helper to parse hex color to RGB
		 * @param {string} hex
		 * @returns {{r: number, g: number, b: number}}
		 */
		function hexToRgb(hex) {
			hex = hex.replace(/^#/, "");
			if (hex.length === 3) {
				hex = hex
					.split("")
					.map((x) => x + x)
					.join("");
			}
			const num = parseInt(hex, 16);
			return {
				r: (num >> 16) & 255,
				g: (num >> 8) & 255,
				b: num & 255,
			};
		}

		/**
		 * Helper to calculate luminance
		 * @param {{r: number, g: number, b: number}} rgb
		 * @returns {number}
		 */
		function luminance({ r, g, b }) {
			const a = [r, g, b].map(function (v) {
				v /= 255;
				return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
		}

		const rgb = hexToRgb(bg);
		const lum = luminance(rgb);

		// If background is dark, use light text; else, use dark text
		return lum < threshold ? page.data.theme.textDark : page.data.theme.textLight;
	}
</script>

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

<!-- Game Overlay -->
{#if game.gameOver}
	<div class="overlay game-over">
		<div class="overlay-content">
			<h2>Game Over!</h2>
			<p>Final Score: {game.score}</p>
			<button class="overlay-btn" onclick={newGame}>Try Again</button>
		</div>
	</div>
{/if}

{#if game.won && !game.canContinue}
	<div class="overlay win">
		<div class="overlay-content">
			<h2>You Won!</h2>
			<p>Score: {game.score}</p>
			<button class="overlay-btn" onclick={continuePlaying}>Keep Playing</button>
			<button class="overlay-btn secondary" onclick={newGame}>New Game</button>
		</div>
	</div>
{/if}

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

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.overlay-content {
		background: white;
		padding: 40px;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
	}

	.overlay-content h2 {
		margin: 0 0 20px 0;
		color: #776e65;
		font-size: 2rem;
	}

	.overlay-content p {
		margin: 0 0 30px 0;
		color: #776e65;
		font-size: 1.2rem;
	}

	.overlay-btn {
		background: #8f7a66;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		margin: 0 10px 10px 0;
		transition: background-color 0.2s;
	}

	.overlay-btn:hover {
		background: #7f6a56;
	}

	.overlay-btn.secondary {
		background: #bbada0;
	}

	.overlay-btn.secondary:hover {
		background: #ab9d90;
	}
</style>
