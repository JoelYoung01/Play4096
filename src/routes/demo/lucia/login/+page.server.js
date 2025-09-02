import { hash, verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

import { db } from "$lib/server/db";
import * as auth from "$lib/server/auth";
import * as table from "$lib/server/db/schema";
import { validateUsername, validatePassword, generateUserId } from "$lib/authUtils";

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
		} catch (error) {
			console.error(error);
			return fail(500, { message: "An error has occurred" });
		}
		return redirect(302, "/demo/lucia");
	},
};
