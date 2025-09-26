import { USER_LEVELS } from "$lib/constants";
import { createStripeSession } from "$lib/server/stripe.js";
import { getLogger } from "$lib/server/requestContext";
import { requireLogin } from "$lib/server/user";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export function load() {
	const user = requireLogin();

	if (user.level === USER_LEVELS.PRO) {
		return redirect(302, "/account");
	}

	return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
	upgrade: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: "Not logged in." });
		}

		let session = null;
		try {
			session = await createStripeSession(locals.user.id);

			if (!session.url) {
				throw new Error("Failed to create checkout session");
			}
		} catch (error) {
			const log = getLogger();
			log.error({ error }, "Stripe session creation error");
			return fail(500, { error: "Failed to create checkout session" });
		}

		return redirect(303, session.url);
	},
};
