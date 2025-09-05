import { browser } from "$app/environment";
import { clearBoard, loadBestScore, loadBoard } from "$lib/localStorage.svelte";
import { gameState } from "./state.svelte.js";

export function load({ data }) {
	if (browser) {
		const storageScore = loadBestScore();
		data.bestScore = Math.max(data.bestScore, storageScore);

		const storageGame = loadBoard();
		if (data.currentGame && storageGame) {
			console.warn("Found a game in local storage, but loading the game from server instead");
			clearBoard();
		} else if (storageGame) {
			data.currentGame = storageGame;
		}

		gameState.bestScore = Math.max(gameState.bestScore, data.bestScore);
	}

	return {
		...data,
	};
}
