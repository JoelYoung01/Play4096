import { DEFAULT_TILE_ANIMATION_SPEED, SPAWN_START_SCALE } from "./constants.js";
import { getTileAnimationDurations } from "./animationSpeed.js";

let nextTileId = 0;

/**
 * @returns {string}
 */
function createTileId() {
	nextTileId += 1;
	return `tile-${nextTileId}`;
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
function posKey(x, y) {
	return `${x},${y}`;
}

/**
 * Drives tile slide, spawn, and merge animations with support for chained moves.
 */
export class TileAnimator {
	/** @type {import("./types").VisualTile[]} */
	tiles = [];

	isAnimating = false;

	/** @type {(animating: boolean) => void | undefined} */
	#onAnimatingChange;

	/** @type {(() => void) | undefined} */
	#onFrame;

	/** @type {(() => number) | undefined} */
	#getSpeed;

	/** @type {Map<string, string>} */
	#logicalMap = new Map();

	/** @type {number | null} */
	#animationFrame = null;

	#lastTimestamp = 0;

	/** @param {{ onAnimatingChange?: (animating: boolean) => void, onFrame?: () => void, getSpeed?: () => number }} [options] */
	constructor(options = {}) {
		this.#onAnimatingChange = options.onAnimatingChange;
		this.#onFrame = options.onFrame;
		this.#getSpeed = options.getSpeed;
	}

	/**
	 * @param {boolean} value
	 */
	#setAnimating(value) {
		this.isAnimating = value;
		this.#onAnimatingChange?.(value);
	}

	/**
	 * @param {number[][]} board
	 */
	syncFromBoard(board) {
		this.#stopAnimation();
		this.tiles = [];
		this.#logicalMap.clear();

		for (let y = 0; y < board.length; y++) {
			for (let x = 0; x < board[y].length; x++) {
				const value = board[y][x];
				if (value !== 0) {
					this.#createTile(x, y, value);
				}
			}
		}

		this.#onFrame?.();
	}

	snapToTargets() {
		for (const tile of this.tiles) {
			tile.currentPos.x = tile.targetPos.x;
			tile.currentPos.y = tile.targetPos.y;
			tile.alpha = 1;
			tile.scale = 1;
			tile.spawning = false;
			tile.mergePop = false;
			tile.mergePopProgress = 0;
		}
	}

	/**
	 * @param {import("./types").GameEvent} event
	 */
	processEvent(event) {
		if (event.start && event.end) {
			this.#processMove(event);
			this.#ensureAnimationRunning();
		} else if (event.end && event.newTileValue !== undefined) {
			this.#processSpawn(event);
			this.#ensureAnimationRunning();
		}
	}

	/**
	 * @param {import("./types").GameEvent[]} events
	 */
	processEvents(events) {
		for (const event of events) {
			this.processEvent(event);
		}
		this.#ensureAnimationRunning();
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} value
	 */
	#createTile(x, y, value) {
		const id = createTileId();
		const position = { x, y };

		/** @type {import("./types").VisualTile} */
		const tile = {
			id,
			value,
			logicalPos: { ...position },
			currentPos: { ...position },
			targetPos: { ...position },
			alpha: 1,
			scale: 1,
			spawning: false,
			merging: false,
			mergePop: false,
			mergePopProgress: 0,
			mergeSurvivorId: null,
			pendingMergeValue: null,
			hidden: false,
		};

		this.tiles.push(tile);
		this.#logicalMap.set(posKey(x, y), id);
		return tile;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {import("./types").VisualTile | undefined}
	 */
	#getTileAt(x, y) {
		const id = this.#logicalMap.get(posKey(x, y));
		if (id) {
			return this.tiles.find((tile) => tile.id === id && !tile.hidden && !tile.merging);
		}

		return this.tiles.find(
			(tile) => !tile.hidden && !tile.merging && tile.logicalPos.x === x && tile.logicalPos.y === y
		);
	}

	/**
	 * @param {import("./types").VisualTile} tile
	 * @param {{ x: number, y: number }} end
	 * @param {number} value
	 */
	#applyMove(tile, end, value) {
		this.#logicalMap.delete(posKey(tile.logicalPos.x, tile.logicalPos.y));
		tile.logicalPos = { x: end.x, y: end.y };
		tile.targetPos = { x: end.x, y: end.y };
		tile.value = value;
		this.#logicalMap.set(posKey(end.x, end.y), tile.id);
	}

	/**
	 * @param {import("./types").GameEvent} event
	 */
	#processMove(event) {
		if (!event.start || !event.end) return;

		const movingTile = this.#getTileAt(event.start.x, event.start.y);
		if (!movingTile) return;

		if (event.merged) {
			const survivor = this.#getTileAt(event.end.x, event.end.y);

			if (survivor && survivor.id !== movingTile.id) {
				this.#logicalMap.delete(posKey(event.start.x, event.start.y));

				movingTile.merging = true;
				movingTile.mergeSurvivorId = survivor.id;
				movingTile.targetPos = { x: event.end.x, y: event.end.y };
				survivor.targetPos = { x: event.end.x, y: event.end.y };
				survivor.pendingMergeValue = event.value * 2;
				survivor.logicalPos = { x: event.end.x, y: event.end.y };
				this.#logicalMap.set(posKey(event.end.x, event.end.y), survivor.id);
				return;
			}

			this.#applyMove(movingTile, event.end, event.value * 2);
			return;
		}

		this.#applyMove(movingTile, event.end, event.value);
	}

	/**
	 * @param {import("./types").GameEvent} event
	 */
	#processSpawn(event) {
		if (!event.end || event.newTileValue === undefined) return;

		const tile = this.#createTile(event.end.x, event.end.y, event.newTileValue);
		tile.spawning = true;
		tile.alpha = 0;
		tile.scale = SPAWN_START_SCALE;
	}

	#ensureAnimationRunning() {
		const durations = getTileAnimationDurations(this.#getSpeed?.() ?? DEFAULT_TILE_ANIMATION_SPEED);

		if (durations.instant) {
			this.#completeInstantly();
			return;
		}

		this.#setAnimating(true);

		if (this.#animationFrame !== null) return;

		this.#lastTimestamp = performance.now();
		this.#animationFrame = requestAnimationFrame(this.#animate);
	}

	#completeInstantly() {
		for (const tile of this.tiles) {
			if (tile.hidden) continue;

			if (tile.merging) {
				tile.hidden = true;

				if (tile.mergeSurvivorId) {
					const survivor = this.tiles.find((entry) => entry.id === tile.mergeSurvivorId);
					if (survivor && survivor.pendingMergeValue !== null) {
						survivor.value = survivor.pendingMergeValue;
						survivor.pendingMergeValue = null;
					}
				}
			}
		}

		this.tiles = this.tiles.filter((tile) => !tile.hidden);
		this.snapToTargets();
		this.#setAnimating(false);
		this.#onFrame?.();
	}

	#stopAnimation() {
		if (this.#animationFrame !== null) {
			cancelAnimationFrame(this.#animationFrame);
			this.#animationFrame = null;
		}
		this.#setAnimating(false);
	}

	#animate = (timestamp) => {
		const durations = getTileAnimationDurations(this.#getSpeed?.() ?? DEFAULT_TILE_ANIMATION_SPEED);

		if (durations.instant) {
			this.#stopAnimation();
			this.#completeInstantly();
			return;
		}

		const dt = Math.min(timestamp - this.#lastTimestamp, 32);
		this.#lastTimestamp = timestamp;

		let allComplete = true;

		for (const tile of this.tiles) {
			if (tile.hidden) continue;

			if (tile.spawning) {
				const nextAlpha = Math.min(1, tile.alpha + dt / durations.spawnDurationMs);
				tile.alpha = nextAlpha;
				tile.scale = SPAWN_START_SCALE + (1 - SPAWN_START_SCALE) * nextAlpha;

				if (nextAlpha < 1) {
					allComplete = false;
				} else {
					tile.spawning = false;
					tile.scale = 1;
				}
			}

			if (tile.mergePop) {
				tile.mergePopProgress += dt / durations.mergeDurationMs;

				if (tile.mergePopProgress >= 1) {
					tile.mergePop = false;
					tile.mergePopProgress = 0;
					tile.scale = 1;
				} else {
					allComplete = false;
					const progress = tile.mergePopProgress;
					const bump = progress < 0.5 ? progress * 2 : 2 - progress * 2;
					tile.scale = 1 + bump * 0.12;
				}
			}

			const dx = tile.targetPos.x - tile.currentPos.x;
			const dy = tile.targetPos.y - tile.currentPos.y;
			const distance = Math.hypot(dx, dy);

			if (distance > 0.001) {
				allComplete = false;
				const step = dt / durations.moveDurationMs;

				if (step >= distance) {
					tile.currentPos.x = tile.targetPos.x;
					tile.currentPos.y = tile.targetPos.y;
				} else {
					tile.currentPos.x += (dx / distance) * step;
					tile.currentPos.y += (dy / distance) * step;
				}
			} else {
				tile.currentPos.x = tile.targetPos.x;
				tile.currentPos.y = tile.targetPos.y;
			}

			if (tile.merging && distance <= 0.001) {
				tile.hidden = true;

				if (tile.mergeSurvivorId) {
					const survivor = this.tiles.find((entry) => entry.id === tile.mergeSurvivorId);
					if (survivor && survivor.pendingMergeValue !== null) {
						survivor.value = survivor.pendingMergeValue;
						survivor.pendingMergeValue = null;
						survivor.mergePop = true;
						survivor.mergePopProgress = 0;
					}
				}
			}
		}

		this.tiles = this.tiles.filter((tile) => !tile.hidden);
		this.#onFrame?.();

		if (!allComplete) {
			this.#animationFrame = requestAnimationFrame(this.#animate);
			return;
		}

		this.snapToTargets();
		this.#animationFrame = null;
		this.#setAnimating(false);
		this.#onFrame?.();
	};

	destroy() {
		this.#stopAnimation();
	}
}
