import { hash, verify } from "@node-rs/argon2";
import { encodeBase32LowerCase } from "@oslojs/encoding";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export const load = async (event) => {
	if (event.locals.user) {
		return redirect(302, "/demo/lucia");
	}
	return {};
};

export const actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const usernameFormInput = formData.get("username");
		const passwordFormInput = formData.get("password");

		const { username, errors: usernameErrors } = validateUsername(usernameFormInput);
		if (usernameErrors.length > 0) {
			return fail(400, {
				message: "Invalid username: " + usernameErrors.join(", "),
				username,
			});
		}
		const { password, errors: passwordErrors } = validatePassword(passwordFormInput);
		if (passwordErrors.length > 0) {
			return fail(400, { message: `Invalid password: ${passwordErrors.join(", ")}` });
		}

		const results = await db.select().from(table.user).where(eq(table.user.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: "Incorrect username or password" });
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});
		if (!validPassword) {
			return fail(400, { message: "Incorrect username or password" });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, "/demo/lucia");
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const usernameFormInput = formData.get("username");
		const passwordFormInput = formData.get("password");

		const { username, errors: usernameErrors } = validateUsername(usernameFormInput);
		if (usernameErrors.length > 0) {
			return fail(400, { message: "Invalid username: " + usernameErrors.join(", "), username });
		}
		const { password, errors: passwordErrors } = validatePassword(passwordFormInput);
		if (passwordErrors.length > 0) {
			return fail(400, { message: "Invalid password: " + passwordErrors.join(", ") });
		}

		const userId = generateUserId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash });

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch {
			return fail(500, { message: "An error has occurred" });
		}
		return redirect(302, "/demo/lucia");
	},
};

/**
 * Generate a random user ID.
 * @returns {string}
 */
function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

/**
 * Validate Username. Returns truthy (error message) if invalid, falsey (no error) if valid.
 * @param {FormDataEntryValue | null} username
 * @returns {{username: string, errors: string[]}}
 */
function validateUsername(username) {
	const errors = [];
	if (typeof username !== "string") {
		errors.push("Not a string");
		return { username: "", errors };
	}

	if (username.length < 3 || username.length > 31)
		errors.push(`Username must be between 3 and 31 characters (found ${username.length})`);
	if (!/^[a-zA-Z0-9@._-]+$/.test(username))
		errors.push(`Username ${username} must be alphanumeric`);

	return { username, errors };
}

/**
 * Validate Password. Returns truthy (error message) if invalid, falsey (no error) if valid.
 * @param {FormDataEntryValue | null} password
 * @returns {{password: string, errors: string[]}}
 */
function validatePassword(password) {
	const errors = [];
	if (typeof password !== "string") {
		errors.push("Not a string");
		return { password: "", errors };
	}

	if (password.length < 6 || password.length > 255)
		errors.push(`Password must be between 6 and 255 characters`);
	return { password, errors };
}
