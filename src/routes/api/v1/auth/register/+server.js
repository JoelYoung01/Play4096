import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { validateUsername, validatePassword, generateUserId } from "$lib/server/auth";
import { err, ok, readJson } from "$lib/server/mobile/http";
import { issueTokenResponse } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request }) {
	const body = await readJson(request);
	if (!body) return err("Invalid JSON body");

	const { username: usernameRaw, password: passwordRaw, email, displayName } = body;
	const { username, errors: usernameErrors } = validateUsername(usernameRaw);
	if (usernameErrors.length) {
		return err("Invalid username: " + usernameErrors.join(", "));
	}
	const { password, errors: passwordErrors } = validatePassword(passwordRaw);
	if (passwordErrors.length) {
		return err("Invalid password: " + passwordErrors.join(", "));
	}

	const existing = db.select().from(table.user).where(eq(table.user.username, username)).get();
	if (existing) {
		return err("Username already exists", 409);
	}

	if (email) {
		const emailTaken = db.select().from(table.user).where(eq(table.user.email, email)).get();
		if (emailTaken) {
			return err("Email already in use", 409);
		}
	}

	const userId = generateUserId();
	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	try {
		await db.insert(table.user).values({
			id: userId,
			username,
			passwordHash,
			email: typeof email === "string" && email.trim() ? email.trim() : null,
		});
		await db.insert(table.userProfile).values({
			id: userId,
			userId,
			displayName: typeof displayName === "string" ? displayName : null,
		});
	} catch {
		return err("Could not create account", 500);
	}

	const token = await issueTokenResponse(userId);
	return ok(token, 201);
}
