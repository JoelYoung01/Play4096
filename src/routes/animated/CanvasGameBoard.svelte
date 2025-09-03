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
	const theme = $derived(page.data.theme || defaultTheme);

	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D | null} */
	let ctx = $state(null);

	// Animation state
	let isAnimating = $state(false);
	/** @type {number | null} */
	let animationFrame = $state(null);
	/** @type {Record<string, any>[]} */
	let animatedTiles = $state([]); // Map of tile positions to animation data

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
	 */
	function drawTile(ctx, x, y, value, alpha = 1, scale = 1, mark = false) {
		if (!value) return;

		const color = theme.tiles[value] || theme.unknownTile;
		const px = x * positionFactor + padding;
		const py = y * positionFactor + padding;
		const w = tileSize * scale + 1;
		const h = tileSize * scale + 1;
		const centerOffsetX = (tileSize - w) / 2;
		const centerOffsetY = (tileSize - h) / 2;

		ctx.save();
		ctx.globalAlpha = alpha;

		// If mark is true, draw a shadow around the tile
		if (mark) {
			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,0.45)";
			ctx.shadowBlur = 18;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}

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

		// If mark is true, restore context to remove shadow for text
		if (mark) {
			ctx.restore();
		}

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
		for (const tileData of animatedTiles) {
			drawTile(
				ctx,
				tileData.currentPos.x,
				tileData.currentPos.y,
				tileData.value,
				tileData.alpha,
				tileData.scale
				// true
			);
		}

		// Draw static tiles (not being animated)
		for (let x = 0; x < game.boardSize; x++) {
			for (let y = 0; y < game.boardSize; y++) {
				const tileAnimation = animatedTiles.find((t) => t.startPos.x === x && t.startPos.y === y);
				if (!tileAnimation) {
					drawTile(ctx, x, y, previousBoard[y][x]);
				}
			}
		}
	}

	/**
	 * @param {number[][]} board
	 */
	function syncBoard(board) {
		console.log("syncing board");
		previousBoard = board.map((/** @type {number[]} */ row) => [...row]);
	}

	/**
	 * Checks if an animation is complete
	 * @param {Record<string, any>} tileData
	 * @returns {boolean}
	 */
	function animationComplete(tileData) {
		if (tileData.type === EVENT_TYPES.MOVE) {
			return (
				tileData.currentPos.x === tileData.endPos.x && tileData.currentPos.y === tileData.endPos.y
			);
		} else if (tileData.type === EVENT_TYPES.SPAWN) {
			return tileData.alpha === 1 && tileData.scale === 1;
		}
		console.error("Unable to determine if animation is complete; unknown animation type", tileData);
		return false;
	}

	/**
	 * Process pending events and start animations
	 */
	function processEvents() {
		// Process events and create animation data
		while (pendingEvents.length > 0) {
			const event = popEvent();
			const eventType = readEventType(event);

			// Move
			if (eventType === EVENT_TYPES.MOVE) {
				if (!event.start || !event.end) {
					console.error("Invalid move event", event);
					continue;
				}

				let existingAnimations = [];
				if (event.merged) {
					existingAnimations = animatedTiles.filter(
						(t) =>
							(t.endPos.x === event.start?.x && t.endPos.y === event.start?.y) ||
							(t.endPos.x === event.end.x && t.endPos.y === event.end.y)
					);
				} else {
					existingAnimations = animatedTiles.filter(
						(t) => t.endPos.x === event.start?.x && t.endPos.y === event.start?.y
					);
				}

				if (existingAnimations.length > 0) {
					// If the tile is already animating, update the existing animation and add a new one

					existingAnimations.forEach((animation) => {
						if (animation.type === EVENT_TYPES.SPAWN) {
							previousBoard[animation.startPos.y][animation.startPos.x] = animation.value;
						}
						animation.type = EVENT_TYPES.MOVE;
						animation.merged = !!event.merged;
						animation.endPos.x = event.end.x;
						animation.endPos.y = event.end.y;
					});
				} else {
					// Create a new animation entry for this tile
					animatedTiles.push({
						alpha: 1,
						scale: 1,
						value: event.value,
						startPos: { x: event.start.x, y: event.start.y },
						currentPos: { x: event.start.x, y: event.start.y },
						type: EVENT_TYPES.MOVE,
						merged: !!event.merged,
						endPos: { x: event.end.x, y: event.end.y },
					});
				}
			}

			// Spawn
			else if (eventType === EVENT_TYPES.SPAWN) {
				if (!event.end) {
					console.error("Invalid spawn event", event);
					continue;
				}
				animatedTiles.push({
					startPos: { x: event.end.x, y: event.end.y },
					currentPos: { x: event.end.x, y: event.end.y },
					endPos: { x: event.end.x, y: event.end.y },
					value: event.value,
					alpha: 0,
					scale: SPAWN_START_SCALE,
					type: EVENT_TYPES.SPAWN,
				});
			}

			// Snapshot
			else if (eventType === EVENT_TYPES.SNAPSHOT) {
				if (!event.snapshot) {
					console.error("Invalid snapshot event", event);
					continue;
				}
				// syncBoard(event.snapshot);
			}
		}

		// Start animation loop
		if (!isAnimating) {
			isAnimating = true;
			animate();
		}
	}

	/**
	 * Animation loop
	 */
	function animate() {
		if (!ctx) return;

		let allAnimationsComplete = true;

		// Update animation states
		for (const tileData of [...animatedTiles]) {
			const speed = theme.speed[tileData.type];

			tileData.alpha = Math.min(tileData.alpha + speed / 10, 1);
			tileData.scale = Math.min(tileData.scale + speed / 10, 1);

			// Fade in and scale up for spawn
			if (tileData.type === EVENT_TYPES.SPAWN) {
				// Check completion and update board state
				if (animationComplete(tileData)) {
					animatedTiles.splice(animatedTiles.indexOf(tileData), 1);
					previousBoard[tileData.startPos.y][tileData.startPos.x] = tileData.value;
				} else {
					allAnimationsComplete = false;
				}
			}

			// Move
			else if (tileData.type === EVENT_TYPES.MOVE) {
				const moveDist = Math.abs(speed / 10);
				const angle = Math.atan2(
					tileData.endPos.y - tileData.currentPos.y,
					tileData.endPos.x - tileData.currentPos.x
				);
				const totalRemainingDistance = Math.sqrt(
					Math.pow(tileData.endPos.x - tileData.currentPos.x, 2) +
						Math.pow(tileData.endPos.y - tileData.currentPos.y, 2)
				);
				const dx = Math.cos(angle) * moveDist;
				const dy = Math.sin(angle) * moveDist;
				if (moveDist > totalRemainingDistance) {
					tileData.currentPos.x = tileData.endPos.x;
					tileData.currentPos.y = tileData.endPos.y;
				} else {
					tileData.currentPos.x = tileData.currentPos.x + dx;
					tileData.currentPos.y = tileData.currentPos.y + dy;
				}

				// Check completion and update board state
				if (animationComplete(tileData)) {
					animatedTiles.splice(animatedTiles.indexOf(tileData), 1);
					previousBoard[tileData.startPos.y][tileData.startPos.x] = 0;
					previousBoard[tileData.endPos.y][tileData.endPos.x] = tileData.merged
						? tileData.value * 2
						: tileData.value;
				} else {
					allAnimationsComplete = false;
				}
			}
		}

		// Draw the board
		drawBoard(ctx);

		// Continue animation or finish
		if (!allAnimationsComplete) {
			animationFrame = requestAnimationFrame(animate);
		} else {
			// Animation complete
			animatedTiles = [];
			isAnimating = false;
			animationFrame = null;
		}
	}

	// Watch for new pending events
	$effect(() => {
		if (pendingEvents.length > 0) {
			processEvents();
		}
	});

	$effect(() => {
		if (!isAnimating) {
			syncBoard(game.board);
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
