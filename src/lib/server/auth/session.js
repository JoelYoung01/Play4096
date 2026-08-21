import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

/** Browser cookie sessions stay long-lived for casual web play. */
export const WEB_SESSION_TTL_MS = DAY_IN_MS * 30;
/** Renew web sessions when less than this much lifetime remains. */
export const WEB_SESSION_RENEW_WINDOW_MS = DAY_IN_MS * 15;

/**
 * API / mobile access tokens are short-lived; clients renew via refresh tokens.
 * One day covers a long play session without forcing mid-game re-auth.
 */
export const ACCESS_TOKEN_TTL_MS = DAY_IN_MS * 1;

/** Refresh tokens last a week; each successful refresh issues a fresh week. */
export const REFRESH_TOKEN_TTL_MS = DAY_IN_MS * 7;

export const sessionCookieName = "auth-session";

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

/**
 * Hash a raw token the same way sessions and refresh tokens are stored.
 * @param {string} token
 */
export function hashToken(token) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

/**
 * @param {string} token
 * @param {string} userId
 * @param {{ ttlMs?: number }} [options]
 */
export async function createSession(token, userId, options = {}) {
	const ttlMs = options.ttlMs ?? WEB_SESSION_TTL_MS;
	const sessionId = hashToken(token);
	const session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + ttlMs),
	};
	await db.insert(table.session).values(session);
	return session;
}

/**
 * Validate a session token. Does not slide expiry — callers that use cookie
 * sessions should call {@link renewSessionIfNeeded} so API access tokens stay short.
 * @param {string} token
 */
export async function validateSessionToken(token) {
	const sessionId = hashToken(token);
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username },
			session: table.session,
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	return { session, user };
}

/**
 * Sliding renewal for long-lived browser cookie sessions only.
 * @param {{ id: string, expiresAt: Date }} session
 */
export async function renewSessionIfNeeded(session) {
	const renewSession = Date.now() >= session.expiresAt.getTime() - WEB_SESSION_RENEW_WINDOW_MS;
	if (!renewSession) return session;

	session.expiresAt = new Date(Date.now() + WEB_SESSION_TTL_MS);
	await db
		.update(table.session)
		.set({ expiresAt: session.expiresAt })
		.where(eq(table.session.id, session.id));
	return session;
}

/** @param {string} sessionId */
export async function invalidateSession(sessionId) {
	await db.delete(table.refreshToken).where(eq(table.refreshToken.sessionId, sessionId));
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

/** @param {string} userId */
export async function invalidateUserSessions(userId) {
	await db.delete(table.refreshToken).where(eq(table.refreshToken.userId, userId));
	await db.delete(table.session).where(eq(table.session.userId, userId));
}

/**
 * @param {import("@sveltejs/kit").RequestEvent} event
 * @param {string} token
 * @param {Date} expiresAt
 */
export function setSessionTokenCookie(event, token, expiresAt) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: "/",
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: "lax",
	});
}

/** @param {import("@sveltejs/kit").RequestEvent} event */
export function deleteSessionTokenCookie(event) {
	event.cookies.delete(sessionCookieName, {
		path: "/",
	});
}
