import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import assert from "node:assert";

export function load({ locals }) {
	const userProfile = db
		.select()
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, locals.user.id))
		.get();

	assert(userProfile, "User profile not found");

	return { userProfile };
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
	deleteAccount: async (event) => {
		if (!event.locals.session) {
			return fail(401, { message: "Not logged in." });
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		await db.delete(table.user).where(eq(table.user.id, event.locals.user.id));

		return redirect(302, "/login");
	},
};
