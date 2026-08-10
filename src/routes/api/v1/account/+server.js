import { eq } from "drizzle-orm";

import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { deleteUser } from "$lib/server/user";
import { err, ok, readJson } from "$lib/server/mobile/http";
import { buildUserPayload } from "$lib/server/mobile/userPayload";
import * as auth from "$lib/server/auth";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) return err("Not logged in", 401);
	const user = buildUserPayload(locals.user.id);
	if (!user) return err("User not found", 404);
	return ok({ user });
}

/** @type {import("./$types").RequestHandler} */
export async function PATCH({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body) return err("Invalid JSON body");

	if (typeof body.displayName === "string") {
		await db
			.update(table.userProfile)
			.set({ displayName: body.displayName.trim() || null })
			.where(eq(table.userProfile.userId, locals.user.id));
	}

	if (typeof body.email === "string") {
		const email = body.email.trim();
		if (email) {
			const taken = db.select().from(table.user).where(eq(table.user.email, email)).get();
			if (taken && taken.id !== locals.user.id) {
				return err("Email already in use", 409);
			}
			await db
				.update(table.user)
				.set({ email, emailVerified: false })
				.where(eq(table.user.id, locals.user.id));
		}
	}

	const user = buildUserPayload(locals.user.id);
	return ok({ user });
}

/** @type {import("./$types").RequestHandler} */
export async function DELETE({ locals }) {
	if (!locals.user) return err("Not logged in", 401);
	if (locals.session) {
		await auth.invalidateSession(locals.session.id);
	}
	await deleteUser(locals.user.id);
	return ok({ success: true });
}
