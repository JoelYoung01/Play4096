import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { validateUsername, validatePassword } from "$lib/server/auth";
import { err, ok, readJson } from "$lib/server/mobile/http";
import { issueTokenResponse } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request }) {
	const body = await readJson(request);
	if (!body) return err("Invalid JSON body");

	const { username: usernameRaw, password: passwordRaw } = body;
	const { username, errors: usernameErrors } = validateUsername(usernameRaw);
	if (usernameErrors.length) {
		return err("Invalid username: " + usernameErrors.join(", "));
	}
	const { password, errors: passwordErrors } = validatePassword(passwordRaw);
	if (passwordErrors.length) {
		return err("Invalid password: " + passwordErrors.join(", "));
	}

	const existingUser = db.select().from(table.user).where(eq(table.user.username, username)).get();
	if (!existingUser?.passwordHash) {
		return err("Incorrect username or password", 401);
	}

	const profile = db
		.select()
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, existingUser.id))
		.get();
	if (!profile) {
		await db.insert(table.userProfile).values({ id: existingUser.id, userId: existingUser.id });
	}

	let validPassword = false;
	try {
		validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});
	} catch {
		validPassword = false;
	}
	if (!validPassword) {
		return err("Incorrect username or password", 401);
	}

	const token = await issueTokenResponse(existingUser.id);
	return ok(token);
}
