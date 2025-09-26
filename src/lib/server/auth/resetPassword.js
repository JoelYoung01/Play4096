import { db } from "$lib/server/db";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { deleteSessionTokenCookie } from "./session";
import { sendEmail } from "../email";
import { logger } from "../logger";
/**
 *
 * @param {string} token
 * @param {string} userId
 * @param {string} email
 * @returns
 */
export async function createPasswordResetSession(token, userId, email) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		code: generateRandomOTP(),
		emailVerified: false,
		twoFactorVerified: false,
	};

	await db.insert(table.passwordResetSession).values(session);
	return session;
}

/**
 * Validate a password reset session token, returning the session and user if valid, otherwise null.
 * @param {string} token
 */
export async function validatePasswordResetSessionToken(token) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = db
		.select()
		.from(table.passwordResetSession)
		.where(eq(table.passwordResetSession.id, sessionId))
		.get();

	if (!session) {
		return { session: null, user: null };
	}

	const user = db.select().from(table.user).where(eq(table.user.id, session.userId)).get();

	if (Date.now() >= session.expiresAt.getTime()) {
		await db
			.delete(table.passwordResetSession)
			.where(eq(table.passwordResetSession.id, session.id));
		return { session: null, user: null };
	}

	return { session, user };
}

/**
 * Set a password reset session as email verified
 * @param {string} sessionId
 */
export function setPasswordResetSessionAsEmailVerified(sessionId) {
	db.update(table.passwordResetSession)
		.set({ emailVerified: true })
		.where(eq(table.passwordResetSession.id, sessionId));
}

/**
 * Invalidate all password reset sessions for a given user ID
 * @param {string} userId
 */
export async function invalidateUserPasswordResetSessions(userId) {
	await db.delete(table.passwordResetSession).where(eq(table.passwordResetSession.userId, userId));
}

/**
 * Validate a password reset session request
 * @param {import("@sveltejs/kit").RequestEvent} event
 */
export async function validatePasswordResetSessionRequest(event) {
	const token = event.cookies.get("password_reset_session") ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const { session, user } = await validatePasswordResetSessionToken(token);
	if (session === null) {
		deleteSessionTokenCookie(event);
	}
	return { session, user };
}

/**
 * Set a password reset session token cookie
 * @param {import("@sveltejs/kit").RequestEvent} event
 * @param {string} token
 * @param {Date} expiresAt
 */
export function setPasswordResetSessionTokenCookie(event, token, expiresAt) {
	event.cookies.set("password_reset_session", token, {
		expires: expiresAt,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: !import.meta.env.DEV,
	});
}

/**
 * Delete a password reset session token cookie
 * @param {import("@sveltejs/kit").RequestEvent} event
 */
export function deletePasswordResetSessionTokenCookie(event) {
	event.cookies.delete("password_reset_session", {
		maxAge: 0,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: !import.meta.env.DEV,
	});
}

/**
 * Send a password reset email
 * @param {string} email
 * @param {string} code
 */
export async function sendPasswordResetEmail(email, code) {
	try {
		await sendEmail(email, "Password Reset", `Your reset code is ${code}`);
	} catch (error) {
		logger.error({ err: error, email }, "Failed to send password reset email");
		throw error;
	}
}
