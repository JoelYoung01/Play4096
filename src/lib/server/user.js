import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";

/**
 * Get the user profile for a given user ID
 * @param {string} userId
 */
export function getUserProfile(userId) {
	return db.select().from(table.userProfile).where(eq(table.userProfile.userId, userId)).get();
}
