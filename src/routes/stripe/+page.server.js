import { createStripeSession } from "$lib/server/stripe.js";
import { fail, redirect } from "@sveltejs/kit";

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
			console.error("Stripe session creation error:", error);
			return fail(500, { error: "Failed to create checkout session" });
		}

		return redirect(303, session.url);
	},
};
