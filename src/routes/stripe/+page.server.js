import { USER_LEVELS } from "$lib/constants";
import { createStripeSession } from "$lib/server/stripe.js";
import { getLogger } from "$lib/server/requestContext";
import { requireLogin } from "$lib/server/user";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export function load() {
	const user = requireLogin();
	const response = {
		alreadyUpgraded: false,
		noEmail: false,
		noEmailVerified: false,
	};

	if (user.level === USER_LEVELS.PRO) {
		response.alreadyUpgraded = true;
	}

	if (!user.email) {
		response.noEmail = true;
	}
	if (!user.emailVerified) {
		response.noEmailVerified = true;
	}

	return response;
}

/** @type {import('./$types').Actions} */
export const actions = {
	upgrade: async () => {
		const user = requireLogin();
		const response = {
			upgrade: {
				error: "",
			},
		};
		if (user.level === USER_LEVELS.PRO) {
			response.upgrade.error = "User already upgraded.";
			return fail(400, response);
		}
		if (!user.email) {
			response.upgrade.error = "Please add an email address and verify it before upgrading.";
			return fail(400, response);
		}
		if (!user.emailVerified) {
			response.upgrade.error = "Please verify your email address before upgrading.";
			return fail(400, response);
		}

		let session = null;
		try {
			session = await createStripeSession(user.id);

			if (!session.url) {
				throw new Error("Failed to create checkout session");
			}
		} catch (error) {
			const log = getLogger();
			log.error({ error }, "Stripe session creation error");
			response.upgrade.error = "Failed to create checkout session";
			return fail(500, response);
		}

		return redirect(303, session.url);
	},
};
