import { generateRandomOTP } from "./utils";
import { db } from "$lib/server/db";
import { ExpiringTokenBucket } from "./rateLimit";
import { encodeBase32 } from "@oslojs/encoding";
import * as table from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../email";

/**
 * Get the email verification request for a given user ID and ID
 * @param {string} userId
 * @param {string} id
 */
export function getUserEmailVerificationRequest(userId, id) {
	const result = db
		.select()
		.from(table.emailVerificationRequest)
		.where(
			and(
				eq(table.emailVerificationRequest.id, id),
				eq(table.emailVerificationRequest.userId, userId)
			)
		)
		.get();
	return result;
}

/**
 * Delete all email verification requests for a given user ID
 * @param {string} userId
 */
export async function deleteUserEmailVerificationRequest(userId) {
	await db
		.delete(table.emailVerificationRequest)
		.where(eq(table.emailVerificationRequest.userId, userId));
}

/**
 * Create a new email verification request
 *
 * Deletes all existing email verification requests for the user before creating a new one.
 *
 * @param {string} userId
 * @param {string} email
 */
export async function createEmailVerificationRequest(userId, email) {
	await deleteUserEmailVerificationRequest(userId);
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32(idBytes).toLowerCase();

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

	const newRequest = {
		id,
		userId,
		code,
		email,
		expiresAt,
	};

	const request = db.insert(table.emailVerificationRequest).values(newRequest).returning().get();
	return request;
}

/**
 * Sends Verification Email
 *
 * @param {string} email
 * @param {string} code
 */
export async function sendVerificationEmail(email, code) {
	const body = `Your Email Verification code for Play4096 is: ${code}`;
	await sendEmail(email, "Email Verification Code", body);
}

/**
 * Sets the email verification request cookie
 * @param {import("@sveltejs/kit").RequestEvent} event
 * @param {any} request
 */
export function setEmailVerificationRequestCookie(event, request) {
	event.cookies.set("email_verification", request.id, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: request.expiresAt,
	});
}

/** @param {import("@sveltejs/kit").RequestEvent} event */
export function deleteEmailVerificationRequestCookie(event) {
	event.cookies.set("email_verification", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0,
	});
}

/** @param {import("@sveltejs/kit").RequestEvent} event */
export function getUserEmailVerificationRequestFromRequest(event) {
	if (event.locals.user === null) {
		return null;
	}
	const id = event.cookies.get("email_verification") ?? null;
	if (id === null) {
		return null;
	}
	const request = getUserEmailVerificationRequest(event.locals.user.id, id);
	if (!request) {
		deleteEmailVerificationRequestCookie(event);
	}
	return request ?? null;
}

/** @type {ExpiringTokenBucket<string>} */
export const sendVerificationEmailBucket = new ExpiringTokenBucket(3, 60 * 10);
