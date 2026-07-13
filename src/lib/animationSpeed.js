import {
	DEFAULT_TILE_ANIMATION_SPEED,
	MAX_TILE_ANIMATION_SPEED,
	MIN_TILE_ANIMATION_SPEED,
	TILE_MERGE_DURATION,
	TILE_MOVE_DURATION_MS,
	TILE_SPAWN_DURATION,
} from "./constants.js";

/**
 * @param {number} speed
 * @returns {number}
 */
export function clampTileAnimationSpeed(speed) {
	return Math.min(MAX_TILE_ANIMATION_SPEED, Math.max(MIN_TILE_ANIMATION_SPEED, Math.round(speed)));
}

/**
 * Linked move + spawn durations from a single 0-10 speed setting.
 * 0 = instant, 5 = default, 10 = twice as fast as default.
 *
 * @param {number} speed
 * @returns {{ moveDurationMs: number, spawnDurationMs: number, mergeDurationMs: number, instant: boolean }}
 */
export function getTileAnimationDurations(speed) {
	const clampedSpeed = clampTileAnimationSpeed(speed);

	if (clampedSpeed === 0) {
		return {
			moveDurationMs: 0,
			spawnDurationMs: 0,
			mergeDurationMs: 0,
			instant: true,
		};
	}

	const speedFactor = clampedSpeed / DEFAULT_TILE_ANIMATION_SPEED;

	return {
		moveDurationMs: TILE_MOVE_DURATION_MS / speedFactor,
		spawnDurationMs: TILE_SPAWN_DURATION / speedFactor,
		mergeDurationMs: TILE_MERGE_DURATION / speedFactor,
		instant: false,
	};
}
