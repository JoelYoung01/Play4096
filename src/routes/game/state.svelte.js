export const gameState = $state({
	/** @type {number} */
	bestScore: 0,

	/** @type {import("$lib/game.svelte.js").Game | null} */
	currentGame: null,

	/** Whether the current game has an active restorable checkpoint */
	hasCheckpoint: false,
});

export const general = $state({
	/** @type {import("$lib/types").UserProfile | null} */
	currentUser: null,
});
