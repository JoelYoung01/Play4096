import { browser } from "$app/environment";
import {
	LOCAL_STORAGE_BEST_SCORE,
	LOCAL_STORAGE_BEST_WIN,
	LOCAL_STORAGE_CURRENT_GAME,
	LOCAL_STORAGE_THEME,
} from "./constants";
import { getTheme } from "./assets/themes";

/**
 * Save the game to local storage
 * @param {import("./types").GameState & {
 *   seed?: number;
 *   rngState?: number;
 *   moveCount?: number;
 *   undoCooldownRemaining?: number;
 *   moves?: number[] | null;
 *   createdOn?: number | null;
 * }} game
 */
export function saveGame({
	id,
	board,
	score,
	seed,
	rngState,
	moveCount,
	undoCooldownRemaining,
	moves,
	createdOn,
}) {
	if (!browser) return;
	localStorage.setItem(
		LOCAL_STORAGE_CURRENT_GAME,
		JSON.stringify({
			id,
			board,
			score,
			seed,
			rngState,
			moveCount,
			undoCooldownRemaining,
			moves: moves ?? null,
			createdOn: createdOn ?? null,
			lastUpdated: Date.now(),
		})
	);
}

/**
 * Load the game from local storage
 * @returns {import("./types").GameState & { lastUpdated: number } | null}
 */
export function loadGame() {
	if (!browser) return null;
	const game = localStorage.getItem(LOCAL_STORAGE_CURRENT_GAME);
	return game ? JSON.parse(game) : null;
}

export function clearGame() {
	if (!browser) return;
	localStorage.removeItem(LOCAL_STORAGE_CURRENT_GAME);
}

/**
 * Save the best score to local storage
 * @param {number} score
 * @param {{ force?: boolean }} [options] When force is true, overwrite even if lower (e.g. after server wipe/resync)
 */
export function saveBestScore(score, options = {}) {
	if (!browser) return;
	const current = loadBestScore();
	if (options.force || score > current) {
		localStorage.setItem(LOCAL_STORAGE_BEST_SCORE, `${score}`);
	}
}

/**
 * Load the best score from local storage
 * @returns {number}
 */
export function loadBestScore() {
	if (!browser) return 0;
	const score = localStorage.getItem(LOCAL_STORAGE_BEST_SCORE);
	return score ? parseInt(score) : 0;
}

export function clearBestScore() {
	if (!browser) return;
	localStorage.removeItem(LOCAL_STORAGE_BEST_SCORE);
}

/**
 * Lowest of the given values, ignoring nulls (lower is better for win stats).
 * @param {...(number | null | undefined)} values
 * @returns {number | null}
 */
export function lowestOf(...values) {
	/** @type {number | null} */
	let lowest = null;
	for (const value of values) {
		if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
		if (lowest == null || value < lowest) lowest = value;
	}
	return lowest;
}

/**
 * Best win stats achieved on this device (exact at-win values).
 * @returns {{ moves: number | null, timeMs: number | null }}
 */
export function loadBestWinStats() {
	if (!browser) return { moves: null, timeMs: null };
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_BEST_WIN);
		if (!raw) return { moves: null, timeMs: null };
		const parsed = JSON.parse(raw);
		return {
			moves: lowestOf(parsed?.moves),
			timeMs: lowestOf(parsed?.timeMs),
		};
	} catch {
		return { moves: null, timeMs: null };
	}
}

/**
 * Record a win's stats, keeping the best (lowest) of stored and provided values.
 * @param {{ moves?: number | null, timeMs?: number | null }} stats
 */
export function saveBestWinStats({ moves = null, timeMs = null } = {}) {
	if (!browser) return;
	const current = loadBestWinStats();
	localStorage.setItem(
		LOCAL_STORAGE_BEST_WIN,
		JSON.stringify({
			moves: lowestOf(current.moves, moves),
			timeMs: lowestOf(current.timeMs, timeMs),
		})
	);
}

export function clearBestWinStats() {
	if (!browser) return;
	localStorage.removeItem(LOCAL_STORAGE_BEST_WIN);
}

/**
 * Persist selected theme id locally (guest / cache fallback)
 * @param {string} themeId
 */
export function saveThemeId(themeId) {
	if (!browser) return;
	localStorage.setItem(LOCAL_STORAGE_THEME, themeId);
}

/**
 * @returns {string | null}
 */
export function loadThemeId() {
	if (!browser) return null;
	const id = localStorage.getItem(LOCAL_STORAGE_THEME);
	if (id && getTheme(id).id === id) {
		return id;
	}
	return null;
}

export function clearThemeId() {
	if (!browser) return;
	localStorage.removeItem(LOCAL_STORAGE_THEME);
}
