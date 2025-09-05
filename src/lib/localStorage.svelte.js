import { browser } from "$app/environment";
import { LOCAL_STORAGE_BEST_SCORE, LOCAL_STORAGE_CURRENT_GAME } from "./constants";

/**
 * Save the board to local storage
 * @param {number[][]} board
 */
export function saveBoard(board) {
	if (!browser) return;
	localStorage.setItem(LOCAL_STORAGE_CURRENT_GAME, JSON.stringify(board));
}

/**
 * Load the board from local storage
 * @returns {number[][] | null}
 */
export function loadBoard() {
	if (!browser) return null;
	const board = localStorage.getItem(LOCAL_STORAGE_CURRENT_GAME);
	return board ? JSON.parse(board) : null;
}

export function clearBoard() {
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
