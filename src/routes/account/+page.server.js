import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import assert from "node:assert";

export function load({ locals }) {
	const user = db.select().from(table.user).where(eq(table.user.id, locals.user.id)).get();

	assert(user, "User not found");

	return { user };
}

export const actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, "/login");
	},
};
