import { browser } from "$app/environment";
import { deserialize } from "$app/forms";
import {
	loadBestScore,
	loadBestWinStats,
	loadGame,
	lowestOf,
	saveBestScore,
} from "$lib/localStorage.svelte";
import { general, gameState } from "./state.svelte.js";

/** @type {import("./$types").PageLoad} */
export async function load({ data, fetch }) {
	let { user, dbGame, winBests } = data;
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

		// Previous best win stats: lowest of session, this device (exact at-win
		// values) and the account's won games (server) for the "New Best!" badges.
		const localWinStats = loadBestWinStats();
		gameState.bestWinMoves = lowestOf(
			gameState.bestWinMoves,
			localWinStats.moves,
			winBests?.leastMovesToWin
		);
		gameState.bestWinTimeMs = lowestOf(
			gameState.bestWinTimeMs,
			localWinStats.timeMs,
			winBests?.fastestWinMs
		);

		if (user) {
			// Authoritative personal best comes from ranked games on the server.
			// Resync (and overwrite inflated localStorage leftovers from old bugs).
			const res = await fetch("/game?/saveScore", {
				method: "POST",
				body: new FormData(),
			});

			if (res.ok) {
				try {
					const result = deserialize(await res.text());
					if (result.type === "success" && typeof result.data?.bestScore === "number") {
						bestScore = result.data.bestScore;
					}
				} catch {
					// Fall back to profile bestScore from SSR
				}
			}

			gameState.bestScore = Math.max(gameState.bestScore, bestScore);
			saveBestScore(bestScore, { force: true });
		} else {
			gameState.bestScore = Math.max(gameState.bestScore, loadBestScore());
		}
	}

	return {
		user,
		dbGame,
		localGame,
		bestScore,
	};
}
