import { redirect } from "@sveltejs/kit";
import assert from "node:assert";
import { getRequestEvent } from "$app/server";

import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import { USER_LEVELS } from "$lib/constants";
import { getLogger } from "./requestContext";

/**
 * Get the user profile for a given user ID
 * @param {string|undefined} userId
 */
export function getUserProfile(userId) {
	if (!userId) {
		return null;
	}

	const user = db
		.select({
			id: table.user.id,
			username: table.user.username,
			email: table.user.email,
			emailVerified: table.user.emailVerified,
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
 * Get a user from their ID
 * @param {string} userId
 */
export function getUser(userId) {
	const user = db.select().from(table.user).where(eq(table.user.id, userId)).get();
	return user ?? null;
}

/**
 * Get a user from their email
 * @param {string} email
 */
export function getUserByEmail(email) {
	const user = db.select().from(table.user).where(eq(table.user.email, email)).get();
	return user ?? null;
}

/**
 * Delete a user from the database
 * @param {string} userId
 */
export async function deleteUser(userId) {
	const log = getLogger().child({ userId });
	if (!userId) {
		log.debug("Unable to delete user; user ID is not set");
		return;
	}

	// Verify user exists
	const user = db.select().from(table.user).where(eq(table.user.id, userId)).get();
	if (!user) {
		log.debug(`Unable to delete user; does not exist`);
		return;
	}

	await db.delete(table.user).where(eq(table.user.id, userId));
}

/**
 * Require the user to be logged in.
 *
 * @param {string} [redirectTo] The URL to redirect to if the user is not logged in.
 * @returns The user if they are logged in, otherwise redirects to the login page.
 */
export function requireLogin(redirectTo) {
	const { locals, url } = getRequestEvent();

	if (!locals.user) {
		if (!redirectTo) {
			redirectTo = url.pathname;
		}
		return redirect(302, `/login?redirectTo=${redirectTo}`);
	}

	let user = getUser(locals.user.id);

	assert(user, `Unable to find user with Id ${locals.user.id}`);

	return user;
}

/**
 * Require the user to be logged in.
 *
 * @param {string} [redirectTo] The URL to redirect to if the user is not logged in.
 * @returns The user profile
 */
export function requireLoginProfile(redirectTo) {
	const { locals, url } = getRequestEvent();

	if (!locals.user) {
		if (!redirectTo) {
			redirectTo = url.pathname;
		}
		return redirect(302, `/login?redirectTo=${redirectTo}`);
	}

	const userProfile = getUserProfile(locals.user.id);

	assert(userProfile, `Unable to find user profile with Id ${locals.user.id}`);

	return userProfile;
}

/**
 * Downgrade a user to the FREE level
 * @param {string} userId
 */
export async function downgradeUser(userId) {
	await db.update(table.user).set({ level: USER_LEVELS.FREE }).where(eq(table.user.id, userId));
}
