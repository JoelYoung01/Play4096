import { browser } from "$app/environment";
import { loadGame } from "$lib/localStorage.svelte";

export async function load({ data }) {
	let hasGame = data.hasDbGame;

	if (browser) {
		// Load game from local storage
		const localGame = loadGame();
		if (localGame) {
			hasGame = true;
		}
	}

	return {
		hasGame,
		user: data.user,
	};
}
