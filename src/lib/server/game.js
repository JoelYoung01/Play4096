import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
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
