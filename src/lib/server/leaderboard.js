import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import { eq, desc } from "drizzle-orm";
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
