import { USER_LEVELS } from "$lib/constants";
import { getUserProfile } from "$lib/server/user";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Full user payload for mobile clients.
 * @param {string} userId
 */
export function buildUserPayload(userId) {
	const user = db.select().from(table.user).where(eq(table.user.id, userId)).get();
	if (!user) return null;

	const profile = getUserProfile(userId);
	return {
		id: user.id,
		username: user.username,
		email: user.email,
		emailVerified: user.emailVerified,
		level: user.level,
		isPro: user.level === USER_LEVELS.PRO,
		admin: user.admin,
		displayName: profile?.displayName ?? null,
		avatarUrl: profile?.avatarUrl ?? null,
		bestScore: profile?.bestScore ?? null,
		themeId: profile?.themeId ?? "classic",
	};
}

/**
 * Issue access + refresh tokens + user payload for API clients.
 * @param {string} userId
 */
export async function issueTokenResponse(userId) {
	const { issueAccessAndRefresh } = await import("$lib/server/auth/refresh.js");
	const issued = await issueAccessAndRefresh(userId);
	const user = buildUserPayload(userId);
	if (!user) {
		throw new Error("User not found after session create");
	}
	return {
		access_token: issued.accessToken,
		expires_at: issued.session.expiresAt.toISOString(),
		refresh_token: issued.refreshToken,
		refresh_expires_at: issued.refresh.expiresAt.toISOString(),
		user,
	};
}
