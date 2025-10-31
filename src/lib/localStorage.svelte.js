import { browser } from "$app/environment";
import { LOCAL_STORAGE_BEST_SCORE, LOCAL_STORAGE_CURRENT_GAME } from "./constants";

/**
 * Save the game to local storage
 * @param {import("./types").GameState} game
 */
export function saveGame({ id, board, score }) {
	if (!browser) return;
	localStorage.setItem(
		LOCAL_STORAGE_CURRENT_GAME,
		JSON.stringify({ id, board, score, lastUpdated: Date.now() })
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
 */
export function saveBestScore(score) {
	if (!browser) return;
	const current = loadBestScore();
	if (score > current) {
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
