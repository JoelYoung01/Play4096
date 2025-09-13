import { redirect } from "@sveltejs/kit";
import assert from "node:assert";
import { getRequestEvent } from "$app/server";

import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import { USER_LEVELS } from "$lib/constants";

/**
 * Get the user profile for a given user ID
 * @param {string|undefined} userId
 */
export function getUser(userId) {
	if (!userId) {
		return null;
	}

	const user = db
		.select({
			id: table.user.id,
			username: table.user.username,
			admin: table.user.admin,
			level: table.user.level,
			displayName: table.userProfile.displayName,
			avatarUrl: table.userProfile.avatarUrl,
			bestScore: table.userProfile.bestScore,
		})
		.from(table.user)
		.innerJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(eq(table.user.id, userId))
		.get();

	return user ?? null;
}

/**
 * Require the user to be logged in.
 *
 * Returns the user if they are logged in, otherwise redirects to the login page.
 */
export function requireLogin() {
	const { locals, url } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	let user = getUser(locals.user.id);

	assert(user, `Unable to find user with Id ${locals.user.id}`);

	return user;
}

/**
 * Downgrade a user to the FREE level
 * @param {string} userId
 */
export async function downgradeUser(userId) {
	await db.update(table.user).set({ level: USER_LEVELS.FREE }).where(eq(table.user.id, userId));
}
