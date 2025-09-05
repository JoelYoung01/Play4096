import { browser } from "$app/environment";
import { clearGame, loadBestScore, loadGame } from "$lib/localStorage.svelte";
import { gameState } from "./state.svelte.js";

export function load({ data }) {
	if (browser) {
		// Only pull from local storage on client
		const storageScore = loadBestScore();
		data.bestScore = Math.max(data.bestScore, storageScore);

		const game = loadGame();
		if (data.currentGame && game) {
			console.warn("Found a game in local storage, but loading the game from server instead");
			clearGame();
		} else if (game) {
			data.currentGame = game;
		}

		gameState.bestScore = Math.max(gameState.bestScore, data.bestScore);
	}

	return {
		...data,
	};
}
