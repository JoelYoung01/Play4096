import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import {
	ACCESS_TOKEN_TTL_MS,
	REFRESH_TOKEN_TTL_MS,
	createSession,
	generateSessionToken,
	hashToken,
	invalidateSession,
} from "./session.js";

/**
 * Persist a hashed refresh token linked to an access session.
 * @param {string} rawToken
 * @param {string} userId
 * @param {string} sessionId
 */
export async function createRefreshToken(rawToken, userId, sessionId) {
	const id = hashToken(rawToken);
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
	const row = {
		id,
		userId,
		sessionId,
		expiresAt,
	};
	await db.insert(table.refreshToken).values(row);
	return row;
}

/**
 * Issue a fresh access + refresh pair for API clients.
 * @param {string} userId
 */
export async function issueAccessAndRefresh(userId) {
	const accessToken = generateSessionToken();
	const session = await createSession(accessToken, userId, { ttlMs: ACCESS_TOKEN_TTL_MS });
	const refreshToken = generateSessionToken();
	const refresh = await createRefreshToken(refreshToken, userId, session.id);
	return {
		accessToken,
		refreshToken,
		session,
		refresh,
	};
}

/**
 * Validate a refresh token and rotate to a new access + refresh pair.
 * Returns null when the refresh token is missing, expired, or already used.
 * @param {string} rawRefreshToken
 */
export async function rotateRefreshToken(rawRefreshToken) {
	if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
		return null;
	}

	const id = hashToken(rawRefreshToken.trim());
	const existing = db
		.select()
		.from(table.refreshToken)
		.where(eq(table.refreshToken.id, id))
		.get();

	if (!existing) {
		return null;
	}

	if (Date.now() >= existing.expiresAt.getTime()) {
		await db.delete(table.refreshToken).where(eq(table.refreshToken.id, id));
		return null;
	}

	const userId = existing.userId;
	// Drop the old access session (and this refresh row via cascade / explicit).
	await invalidateSession(existing.sessionId);

	return issueAccessAndRefresh(userId);
}
