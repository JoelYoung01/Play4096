<script>
	import { onDestroy } from "svelte";
	import { page } from "$app/state";
	import { defaultTheme } from "$lib/assets/themes";
	import { getTileColor } from "$lib/game.svelte.js";
	import { EVENT_TYPES, SPAWN_START_SCALE } from "$lib/constants.js";
	import GameControls from "$lib/GameControls.svelte";
	import BasicBoard from "$lib/BasicBoard.svelte";

	let { game, pendingEvents, newGame, popEvent, continuePlaying } = $props();

	const size = 460;
	const padding = 10;
	const tileBorderRadius = 8;
	const boardBorderRadius = 12;
	const tileSize = $derived((size - padding * (game.boardSize + 1)) / game.boardSize);
	const positionFactor = $derived(tileSize + padding);
	const nextBoard = $derived(
		pendingEvents.find((/** @type {import("$lib/types").GameEvent} */ evt) => evt.snapshot)
			?.snapshot || game.board
	);
	const theme = $derived(page.data.theme || defaultTheme);

	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D | null} */
	let ctx = $state(null);

	// Animation state
	let isAnimating = $state(false);
	/** @type {number | null} */
	let animationFrame = $state(null);
	/** @type {import("$lib/types").GameEvent[]} */
	let currentEvents = $state([]);
	let animatedTiles = $state(new Map()); // Map of tile positions to animation data

	let previousBoard = $state(game.board.map((/** @type {number[]} */ row) => [...row]));

	/**
	 * @param {import("$lib/types").GameEvent} evt
	 * @returns {string | null}
	 */
	function readEventType(evt) {
		if (evt.start && evt.end) {
			return EVENT_TYPES.MOVE;
		} else if (evt.end && !evt.start) {
			return EVENT_TYPES.SPAWN;
		} else if (evt.snapshot) {
			return EVENT_TYPES.SNAPSHOT;
		}
		return null;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} x
	 * @param {number} y
	 * @param {number} value
	 * @param {number} alpha - opacity for fade effects
	 * @param {number} scale - scale for merge effects
	 * @param {number} offsetX - optional x offset for animations
	 * @param {number} offsetY - optional y offset for animations
	 */
	function drawTile(ctx, x, y, value, alpha = 1, scale = 1, offsetX = 0, offsetY = 0) {
		if (!value) return;

		const color = theme.tiles[value] || theme.unknownTile;
		const px = x * positionFactor + padding + offsetX;
		const py = y * positionFactor + padding + offsetY;
		const w = tileSize * scale + 1;
		const h = tileSize * scale + 1;
		const centerOffsetX = (tileSize - w) / 2;
		const centerOffsetY = (tileSize - h) / 2;

		ctx.save();
		ctx.globalAlpha = alpha;

		ctx.fillStyle = color;

		// Draw rounded rectangle
		ctx.beginPath();
		ctx.moveTo(px + centerOffsetX + tileBorderRadius, py + centerOffsetY);
		ctx.lineTo(px + centerOffsetX + w - tileBorderRadius, py + centerOffsetY);
		ctx.quadraticCurveTo(
			px + centerOffsetX + w,
			py + centerOffsetY,
			px + centerOffsetX + w,
			py + centerOffsetY + tileBorderRadius
		);
		ctx.lineTo(px + centerOffsetX + w, py + centerOffsetY + h - tileBorderRadius);
		ctx.quadraticCurveTo(
			px + centerOffsetX + w,
			py + centerOffsetY + h,
			px + centerOffsetX + w - tileBorderRadius,
			py + centerOffsetY + h
		);
		ctx.lineTo(px + centerOffsetX + tileBorderRadius, py + centerOffsetY + h);
		ctx.quadraticCurveTo(
			px + centerOffsetX,
			py + centerOffsetY + h,
			px + centerOffsetX,
			py + centerOffsetY + h - tileBorderRadius
		);
		ctx.lineTo(px + centerOffsetX, py + centerOffsetY + tileBorderRadius);
		ctx.quadraticCurveTo(
			px + centerOffsetX,
			py + centerOffsetY,
			px + centerOffsetX + tileBorderRadius,
			py + centerOffsetY
		);
		ctx.closePath();
		ctx.fill();

		// Choose text color for contrast
		const textColor = getTileColor(value);
		ctx.fillStyle = textColor;

		// Scale font size based on tile scale and number of digits
		const valueStr = value.toString();
		const numDigits = valueStr.length;
		// Base font size for 1 digit, scale down by 0.85 per extra digit
		const baseFontSize = tileSize * 0.6;
		const scalePerDigit = 0.85;
		const fontSize = Math.floor(baseFontSize * Math.pow(scalePerDigit, numDigits - 1) * scale);

		ctx.font = `bold ${fontSize}px Arial, sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		// Draw text in the center of the scaled tile
		ctx.fillText(valueStr, px + tileSize / 2, py + tileSize / 2 + 2);
		ctx.restore();
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	function drawBoard(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Draw animated tiles
		for (const [, tileData] of animatedTiles) {
			// Calculate current position for moving tiles
			const startX = tileData.startPos.x * positionFactor + padding;
			const startY = tileData.startPos.y * positionFactor + padding;
			const endX = tileData.endPos.x * positionFactor + padding;
			const endY = tileData.endPos.y * positionFactor + padding;
			const offsetX = (endX - startX) * tileData.progress;
			const offsetY = (endY - startY) * tileData.progress;

			drawTile(
				ctx,
				tileData.startPos.x,
				tileData.startPos.y,
				tileData.value,
				tileData.alpha,
				tileData.scale,
				offsetX,
				offsetY
			);
		}

		// Draw static tiles (not being animated)
		for (let x = 0; x < game.boardSize; x++) {
			for (let y = 0; y < game.boardSize; y++) {
				const key = `${x},${y}`;
				if (!animatedTiles.has(key)) {
					drawTile(ctx, x, y, previousBoard[y][x]);
				}
			}
		}
	}

	/**
	 * @param {number[][]} board
	 */
	function syncBoard(board) {
		previousBoard = board.map((/** @type {number[]} */ row) => [...row]);
	}

	/**
	 * Process pending events and start animations
	 */
	function processEvents() {
		if (isAnimating) return;

		// Check if completed processing all events
		if (pendingEvents.length === 0) {
			// Sync the previous board with the current board
			syncBoard(game.board);
			return;
		}

		isAnimating = true;
		currentEvents = [];
		animatedTiles.clear();

		// Pull pending events off queue (batched by type)
		const firstType = readEventType(pendingEvents[0]);
		while (pendingEvents.length > 0 && readEventType(pendingEvents[0]) === firstType) {
			currentEvents.push(popEvent());
		}

		// Process events and create animation data
		for (const event of currentEvents) {
			const eventType = readEventType(event);
			if (eventType === EVENT_TYPES.SNAPSHOT) {
				if (!event.snapshot) {
					console.error("Invalid snapshot event", event);
					continue;
				}
				syncBoard(event.snapshot);
			} else if (eventType === EVENT_TYPES.MOVE) {
				if (!event.start || !event.end) {
					console.error("Invalid move event", event);
					continue;
				}
				const startKey = `${event.start.x},${event.start.y}`;

				// Get the tile value from the base board (before the move)
				const tileValue = previousBoard[event.start.y][event.start.x];
				if (!tileValue) continue;
				animatedTiles.set(startKey, {
					value: tileValue,
					startPos: { x: event.start.x, y: event.start.y },
					endPos: { x: event.end.x, y: event.end.y },
					alpha: 1,
					scale: 1,
					progress: 0,
					startTime: Date.now(),
					type: EVENT_TYPES.MOVE,
				});
			} else if (eventType === EVENT_TYPES.SPAWN) {
				if (!event.end) {
					console.error("Invalid spawn event", event);
					continue;
				}
				const spawnKey = `${event.end.x},${event.end.y}`;
				const spawnValue = nextBoard[event.end.y][event.end.x];
				if (!spawnValue) {
					console.error("Invalid spawn value", event, nextBoard);
					continue;
				}
				animatedTiles.set(spawnKey, {
					startPos: { x: event.end.x, y: event.end.y },
					endPos: { x: event.end.x, y: event.end.y },
					value: spawnValue,
					alpha: 0,
					scale: SPAWN_START_SCALE,
					progress: 0,
					startTime: Date.now(),
					type: EVENT_TYPES.SPAWN,
				});
			}
		}

		// Start animation loop
		animate();
	}

	/**
	 * Animation loop
	 */
	function animate() {
		if (!ctx) return;

		let allAnimationsComplete = true;

		// Update animation states
		for (const [, tileData] of animatedTiles) {
			// Skip if this tile's animation is complete
			if (tileData.progress === 1) continue;

			const speed = theme.speed[tileData.type];
			const progress = Math.min(tileData.progress + speed / 100, 1);

			tileData.progress = progress;

			if (tileData.type === EVENT_TYPES.SPAWN) {
				// Fade in and scale up for spawn
				tileData.alpha = progress;
				tileData.scale = SPAWN_START_SCALE + (1 - SPAWN_START_SCALE) * progress;
			}

			if (progress < 1) {
				allAnimationsComplete = false;
			}
		}

		// Draw the board
		drawBoard(ctx);

		// Continue animation or finish
		if (!allAnimationsComplete) {
			animationFrame = requestAnimationFrame(animate);
		} else {
			// Animation complete
			animatedTiles.clear();
			isAnimating = false;
			animationFrame = null;
			processEvents();
		}
	}

	// Watch for new pending events
	$effect(() => {
		if (pendingEvents.length > 0) {
			processEvents();
		}
	});

	// Initialize canvas context
	$effect(() => {
		if (!canvas) return;
		ctx = canvas.getContext("2d");
		if (!ctx) return;
		drawBoard(ctx);
	});

	// Cleanup on unmount
	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	});
</script>

<GameControls {game} {newGame} {continuePlaying} />

<div
	class="game-board-container overflow-hidden"
	style:width={`${size}px`}
	style:height={`${size}px`}
>
	<canvas width={size} height={size} bind:this={canvas}>
		<BasicBoard {game} {newGame} />
	</canvas>
	<div
		class="game-board"
		style:grid-template-columns={`repeat(${game.boardSize}, 1fr)`}
		style:grid-template-rows={`repeat(${game.boardSize}, 1fr)`}
		style:background-color={theme.boardBackground}
		style:border-radius={`${boardBorderRadius}px`}
		style:padding={`${padding}px`}
		style:gap={`${padding}px`}
	>
		{#each game.board as row, rowIndex (rowIndex)}
			{#each row, colIndex (colIndex)}
				<div
					class="tile empty"
					style:background-color={theme.emptyTile}
					style:border-radius={`${tileBorderRadius}px`}
				></div>
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
		aspect-ratio: 1;

		z-index: 1;
	}

	.tile {
		display: flex;
		flex: 0 0 auto;
		overflow: hidden;
		position: relative;
	}
</style>
