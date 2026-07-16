import { browser } from "$app/environment";
import {
	LOCAL_STORAGE_BEST_SCORE,
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
