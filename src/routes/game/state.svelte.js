export const gameState = $state({
	/** @type {number} */
	bestScore: 0,

	/** Fewest moves in any previous win — null until a win is known @type {number | null} */
	bestWinMoves: null,

	/** Fastest previous win in ms — null until a win is known @type {number | null} */
	bestWinTimeMs: null,

	/** @type {import("$lib/game.svelte.js").Game | null} */
	currentGame: null,

	/** Whether the current game has an active restorable checkpoint */
	hasCheckpoint: false,
});

export const general = $state({
	/** @type {import("$lib/types").UserProfile | null} */
	currentUser: null,
});
