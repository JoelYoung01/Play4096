import { eq, desc, count, and, gt } from "drizzle-orm";
import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export async function getAllTimeLeaderboard() {
	const leaderboard = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			displayName: table.userProfile.displayName,
			bestScore: table.userProfile.bestScore,
		})
		.from(table.user)
		.innerJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(eq(table.user.level, USER_LEVELS.PRO))
		.orderBy(desc(table.userProfile.bestScore))
		.limit(10);

	return leaderboard;
}

/**
 * Get the rank of a user in the all time leaderboard
 * @param {string} userId
 */
export async function getAllTimeUserRank(userId) {
	const userResult = db
		.select({
			bestScore: table.userProfile.bestScore,
		})
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, userId))
		.get();

	const bestScore = userResult?.bestScore ?? 0;

	const [{ count: betterUsersCount }] = await db
		.select({
			count: count(),
		})
		.from(table.user)
		.innerJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(and(eq(table.user.level, USER_LEVELS.PRO), gt(table.userProfile.bestScore, bestScore)));

	return betterUsersCount + 1;
}
