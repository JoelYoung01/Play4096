import { db } from "$lib/server/db";
import { hashPassword } from "./password";
import { generateUserId } from "./utils";
import * as table from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

/** @param {string} username */
export function checkUsername(username) {
	const existing = db.select().from(table.user).where(eq(table.user.username, username)).get();
	if (existing) {
		return ["Username already exists"];
	}

	const errors = [];

	if (username.length < 3 || username.length > 31) {
		errors.push("Username must be between 3 and 31 characters");
	}
	if (!/^[a-zA-Z0-9@._-]+$/.test(username)) {
		errors.push("Username must be alphanumeric");
	}
	if (username.trim() !== username) {
		errors.push("Username must not contain leading or trailing whitespace");
	}

	return errors;
}

/**
 * Verify a username input
 * @param {string} username
 */
export function verifyUsernameInput(username) {
	return checkUsername(username).length === 0;
}

/**
 * Create a user
 * @param {string} username
 * @param {string} password
 * @param {string?} email
 * @returns
 */
export async function createUser(username, password, email) {
	const userId = generateUserId();
	const passwordHash = await hashPassword(password);

	const newUser = {
		id: userId,
		username,
		passwordHash,
		email,
	};

	const user = db.insert(table.user).values(newUser).returning().get();
	return user;
}

/**
 * Update a user's password
 * @param {string} userId
 * @param {string} password
 */
export async function updateUserPassword(userId, password) {
	const passwordHash = await hashPassword(password);
	await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, userId));
}

/**
 * Update a user's email and set email as verified
 * @param {string} userId
 * @param {string} email
 */
export async function updateUserEmailAndSetEmailAsVerified(userId, email) {
	await db.update(table.user).set({ email, emailVerified: true }).where(eq(table.user.id, userId));
}

/**
 * Set a user's email as verified if the email matches
 * @param {string} userId
 * @param {string} email
 */
export function setUserAsEmailVerifiedIfEmailMatches(userId, email) {
	return db
		.update(table.user)
		.set({ emailVerified: true })
		.where(and(eq(table.user.id, userId), eq(table.user.email, email)))
		.returning()
		.get();
}

/**
 * Get a user's password hash
 * @param {string} userId
 */
export function getUserPasswordHash(userId) {
	const row = db
		.select({ passwordHash: table.user.passwordHash })
		.from(table.user)
		.where(eq(table.user.id, userId))
		.get();
	if (!row) {
		throw new Error("Invalid user ID");
	}
	return row.passwordHash;
}
