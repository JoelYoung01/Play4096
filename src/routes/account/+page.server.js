import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { deleteUser } from "$lib/server/user";

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

		if (!event.locals.user) {
			return fail(401, { message: "Not logged in." });
		}
		await deleteUser(event.locals.user.id);

		return redirect(302, "/login");
	},
};
