import { verifyEmailInput } from "$lib/server/auth/email";
import { getUserByEmail } from "$lib/server/user";
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
} from "$lib/server/auth/resetPassword";
import { RefillingTokenBucket } from "$lib/server/auth/rateLimit";
import { generateSessionToken } from "$lib/server/auth/session";
import { fail, redirect } from "@sveltejs/kit";

/** @type {RefillingTokenBucket<string>} */
const ipBucket = new RefillingTokenBucket(3, 60);

/** @type {RefillingTokenBucket<string>} */
const userBucket = new RefillingTokenBucket(3, 60);

export const actions = {
	default: action,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function action(event) {
	const response = {
		message: "",
		email: "",
	};

	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		response.message = "Too many requests";
		return fail(429, response);
	}

	const formData = await event.request.formData();
	const email = formData.get("email");
	if (typeof email !== "string") {
		response.message = "Invalid or missing fields";
		return fail(400, response);
	}

	response.email = email;
	if (!verifyEmailInput(email)) {
		response.message = "Invalid email";
		return fail(400, response);
	}

	const user = getUserByEmail(email);
	if (user === null || user.email === null) {
		response.message = "An account with this email address does not exist";
		return fail(400, response);
	}
	if (!user.emailVerified) {
		response.message = "Your email address is not verified. Please contact support.";
		return fail(400, response);
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		response.message = "Too many requests";
		return fail(400, response);
	}
	if (!userBucket.consume(user.id, 1)) {
		response.message = "Too many requests";
		return fail(400, response);
	}

	await invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = await createPasswordResetSession(sessionToken, user.id, user.email);
	await sendPasswordResetEmail(session.email, session.code);
	setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);
	return redirect(302, "/reset-password/verify-email");
}
