import { hash, verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

import { db } from "$lib/server/db";
import * as auth from "$lib/server/auth";
import * as table from "$lib/server/db/schema";
import { validateUsername, validatePassword, generateUserId } from "$lib/authUtils";

export const load = async (event) => {
	// Redirect if user is already logged in
	if (event.locals.user) {
		return redirect(302, "/account");
	}

	// Get redirectTo from query parameters
	const redirectTo = event.url.searchParams.get("redirectTo");

	return {
		redirectTo,
	};
};

export const actions = {
	login: async (event) => {
		// Pull form data
		const formData = await event.request.formData();
		const usernameFormInput = formData.get("username");
		const passwordFormInput = formData.get("password");

		// Validate credentials
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

		// Check if user exists
		const existingUser = db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username))
			.get();
		if (!existingUser) {
			return fail(400, { message: "Incorrect username or password" });
		}

		// Ensure user profile exists, create if it doesn't
		const userProfile = db
			.select()
			.from(table.userProfile)
			.where(eq(table.userProfile.userId, existingUser.id))
			.get();
		if (!userProfile) {
			await db.insert(table.userProfile).values({ id: existingUser.id, userId: existingUser.id });
		}

		// Check password against hash
		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});
		if (!validPassword) {
			return fail(400, { message: "Incorrect username or password" });
		}

		// Create session and set cookie
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Redirect to original page or home
		const redirectTo = formData.get("redirectTo")?.toString() || "/";
		return redirect(302, redirectTo);
	},

	register: async (event) => {
		// Pull form data
		const formData = await event.request.formData();
		const usernameFormInput = formData.get("username");
		const passwordFormInput = formData.get("password");

		// Validate credentials
		const { username, errors: usernameErrors } = validateUsername(usernameFormInput);
		if (usernameErrors.length > 0) {
			return fail(400, { message: "Invalid username: " + usernameErrors.join(", "), username });
		}
		const { password, errors: passwordErrors } = validatePassword(passwordFormInput);
		if (passwordErrors.length > 0) {
			return fail(400, { message: "Invalid password: " + passwordErrors.join(", ") });
		}

		// Check if username already exists
		const results = await db.select().from(table.user).where(eq(table.user.username, username));
		const existingUser = results.at(0);
		if (existingUser) {
			return fail(400, { message: "Username already exists" });
		}

		// Generate user ID and hash password
		const userId = generateUserId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});

		// Create user and session
		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash });

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (error) {
			console.error(error);
			return fail(500, { message: "An error has occurred" });
		}

		// Create user profile
		await db.insert(table.userProfile).values({ id: userId, userId });

		// Redirect to original page or home
		const redirectTo = formData.get("redirectTo")?.toString() ?? "/";
		return redirect(302, redirectTo);
	},
};
