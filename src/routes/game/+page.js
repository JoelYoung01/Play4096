import { browser } from "$app/environment";
import { loadBestScore, loadGame } from "$lib/localStorage.svelte";
import { general, gameState } from "./state.svelte.js";

/** @type {import("./$types").PageLoad} */
export async function load({ data, fetch }) {
	let { user, dbGame } = data;
	let bestScore = user?.bestScore ?? 0;
	let localGame = null;

	// Load user profile
	if (user) {
		general.currentUser = user;
	}

	// Only pull from local storage on client
	if (browser) {
		// Load game from local storage
		localGame = loadGame();

		// Compare local vs db best score, take highest
		const storageScore = loadBestScore();
		gameState.bestScore = Math.max(gameState.bestScore, storageScore);
		gameState.bestScore = Math.max(gameState.bestScore, bestScore);

		// If the best score is higher than what came from the server, update the server
		if (gameState.bestScore > bestScore) {
			const form = new FormData();
			form.append("score", `${gameState.bestScore}`);
			await fetch("/game?/saveScore", {
				method: "POST",
				body: form,
			});
		}
	}

	return {
		user,
		dbGame,
		localGame,
		bestScore,
	};
}
