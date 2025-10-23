import {
	validatePasswordResetSessionRequest,
	setPasswordResetSessionAsEmailVerified,
} from "$lib/server/auth/resetPassword";
import { ExpiringTokenBucket } from "$lib/server/auth/rateLimit";
import { setUserAsEmailVerifiedIfEmailMatches } from "$lib/server/auth/user";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import("$lib/server/auth/rateLimit").ExpiringTokenBucket<string>} */
const bucket = new ExpiringTokenBucket(5, 60 * 30);

/** @type {import("./$types").PageServerLoad} */
export async function load(event) {
	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		return redirect(302, "/forgot-password");
	}
	if (session.emailVerified) {
		return redirect(302, "/reset-password");
	}
	return {
		email: session.email,
	};
}

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	default: action,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function action(event) {
	const response = {
		message: "",
	};
	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		response.message = "Not authenticated";
		return fail(401, response);
	}
	if (session.emailVerified) {
		response.message = "Forbidden";
		return fail(403, response);
	}
	if (!bucket.check(session.userId, 1)) {
		response.message = "Too many requests";
		return fail(429, response);
	}

	const formData = await event.request.formData();
	const code = formData.get("code");
	if (typeof code !== "string") {
		response.message = "Invalid or missing fields";
		return fail(400, response);
	}
	if (code === "") {
		response.message = "Please enter your code";
		return fail(400, response);
	}
	if (!bucket.consume(session.userId, 1)) {
		response.message = "Too many requests";
		return fail(429, response);
	}
	if (code !== session.code) {
		response.message = "Incorrect code";
		return fail(400, response);
	}

	bucket.reset(session.userId);
	await setPasswordResetSessionAsEmailVerified(session.id);
	const emailMatches = setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
	if (!emailMatches) {
		response.message =
			"Please restart the process; your email address does not match the email address in your account";
		return fail(400, response);
	}

	return redirect(302, "/reset-password");
}
