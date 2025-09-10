import { browser } from "$app/environment";
import { clearGame, loadBestScore, loadGame } from "$lib/localStorage.svelte";
import { gameState } from "./state.svelte.js";

export async function load({ data, fetch }) {
	// Only pull from local storage on client
	if (browser) {
		// Load current game
		const game = loadGame();
		if (data.currentGame && game) {
			console.warn("Found a game in local storage, but loading the game from server instead");
			clearGame();
		} else if (game) {
			data.currentGame = game;
		}

		// Load best score
		const storageScore = loadBestScore();
		gameState.bestScore = Math.max(gameState.bestScore, storageScore);
		gameState.bestScore = Math.max(gameState.bestScore, data.bestScore);

		// If the best score is higher than what came from the server, update the server
		if (gameState.bestScore > data.bestScore) {
			const form = new FormData();
			form.append("score", `${gameState.bestScore}`);
			await fetch("/game?/saveScore", {
				method: "POST",
				body: form,
			});
		}
	}

	return {
		...data,
	};
}
