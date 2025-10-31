import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { and, desc, eq, not } from "drizzle-orm";
import assert from "node:assert";

/**
 * Check if the score is the new best score and update the user profile if it is
 * @param {number} score
 * @param {string} userId
 */
export async function saveScore(score, userId) {
	const userProfile = db
		.select()
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, userId))
		.get();

	assert(userProfile, "User profile not found");

	if (!userProfile.bestScore || score > userProfile.bestScore) {
		await db
			.update(table.userProfile)
			.set({ bestScore: score })
			.where(eq(table.userProfile.userId, userId));
	}
}

/**
 * Save a game to the database.
 *
 * Creates a game if the id is not in the database.
 *
 * Updates a game otherwise. Checks won flag and sets completedOn date if the game was won.
 *
 *
 * @param {import("$lib/types").GameSaveData} game
 * @returns {Promise<string>} The id of the saved game
 */
export async function saveGame(game) {
	let existingGame = null;

	if (game.id) {
		existingGame = db.select().from(table.game).where(eq(table.game.id, game.id)).get();
		assert(existingGame, `Game with id ${game.id} not found`);
	}

	// If game with id already exists, check for win (to save a completedOn date) and update the game
	if (game.id && existingGame) {
		let completedOn = existingGame.completedOn;
		if (!existingGame.won && game.won) {
			completedOn = new Date();
		}

		await db
			.update(table.game)
			.set({
				...game,
				completedOn,
				updatedOn: new Date(),
			})
			.where(eq(table.game.id, game.id));
	}

	// If game did not exist in db, create it.
	else {
		const newGame = db
			.insert(table.game)
			.values({
				...game,
				id: crypto.randomUUID(),
				createdOn: new Date(),
				updatedOn: new Date(),
				won: game.won,
				complete: game.complete,
			})
			.returning({ id: table.game.id })
			.get();

		game.id = newGame.id;
	}

	return game.id;
}

/**
 * Get the current game for a user
 *
 * @param {string} userId
 */
export function getCurrentGame(userId) {
	const game = db
		.select()
		.from(table.game)
		.where(and(eq(table.game.playerId, userId), not(eq(table.game.complete, true))))
		.orderBy(desc(table.game.updatedOn))
		.get();

	return game ?? null;
}
