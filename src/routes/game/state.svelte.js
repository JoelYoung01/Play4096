export const gameState = $state({
	/** @type {number} */
	bestScore: 0,

	/** @type {import("$lib/game.svelte.js").Game | null} */
	currentGame: null,
});
