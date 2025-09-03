<script>
	import { page } from "$app/state";
	import BasicBoard from "$lib/BasicBoard.svelte";

	let { game, pendingEvents, newGame, removeEvent } = $props();

	const size = $state(460);
	const padding = $state(10);
	const tileSize = $derived((size - padding * 5) / game.boardSize);
	const positionFactor = $derived(tileSize + padding);

	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D | null} */
	let ctx = $state(null);

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} x
	 * @param {number} y
	 * @param {number} value
	 */
	function drawTile(ctx, x, y, value) {
		if (!value) return;

		const color = page.data.theme.tiles[value] || page.data.theme.unknownTile;
		const radius = 12;
		const px = x * positionFactor + padding;
		const py = y * positionFactor + padding;
		const w = tileSize;
		const h = tileSize;

		ctx.fillStyle = color;

		// Draw rounded rectangle
		ctx.beginPath();
		ctx.moveTo(px + radius, py);
		ctx.lineTo(px + w - radius, py);
		ctx.quadraticCurveTo(px + w, py, px + w, py + radius);
		ctx.lineTo(px + w, py + h - radius);
		ctx.quadraticCurveTo(px + w, py + h, px + w - radius, py + h);
		ctx.lineTo(px + radius, py + h);
		ctx.quadraticCurveTo(px, py + h, px, py + h - radius);
		ctx.lineTo(px, py + radius);
		ctx.quadraticCurveTo(px, py, px + radius, py);
		ctx.closePath();
		ctx.fill();

		// Choose text color for contrast
		const textColor = value <= 4 ? page.data.theme.textLight : page.data.theme.textDark;
		ctx.fillStyle = textColor;

		// Scale font size down for each digit
		const valueStr = value.toString();
		const numDigits = valueStr.length;
		// Base font size for 1 digit, scale down by 0.85 per extra digit
		const baseFontSize = tileSize * 0.6;
		const scalePerDigit = 0.85;
		const fontSize = Math.floor(baseFontSize * Math.pow(scalePerDigit, numDigits - 1));

		ctx.font = `bold ${fontSize}px Arial, sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.save();
		// Draw text in the center of the tile
		ctx.fillText(valueStr, px + w / 2, py + h / 2 + 2);
		ctx.restore();
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	function drawBoard(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		for (let x = 0; x < game.boardSize; x++) {
			for (let y = 0; y < game.boardSize; y++) {
				drawTile(ctx, x, y, game.board[y][x]);
			}
		}
	}

	$effect(() => {
		if (!canvas) return;
		ctx = canvas.getContext("2d");
		if (!ctx) return;
		drawBoard(ctx);
	});
</script>

<div
	class="game-board-container overflow-hidden rounded-xl"
	style:width={`${size}px`}
	style:height={`${size}px`}
>
	<canvas width={size} height={size} bind:this={canvas}>
		<BasicBoard {game} {newGame} />
	</canvas>
	<div class="game-board">
		{#each game.board as row, rowIndex (rowIndex)}
			{#each row, colIndex (colIndex)}
				<div class="tile empty" style:background-color={page.data.theme.emptyTile}></div>
			{/each}
		{/each}
	</div>
</div>

<style lang="postcss">
	.game-board-container {
		position: relative;

		z-index: 0;
	}

	.game-board-container canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
	}

	.game-board {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 10px;
		background: #bbada0;
		padding: 10px;
		border-radius: 8px;
		aspect-ratio: 1;

		z-index: 1;
	}

	.tile {
		border-radius: 12px;
		display: flex;
		flex: 0 0 auto;
		overflow: hidden;
		position: relative;
	}
</style>
