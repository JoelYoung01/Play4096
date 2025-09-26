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

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	default: action,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function action(event) {
	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			email: "",
		});
	}

	const formData = await event.request.formData();
	const email = formData.get("email");
	if (typeof email !== "string") {
		return fail(400, {
			message: "Invalid or missing fields",
			email: "",
		});
	}
	if (!verifyEmailInput(email)) {
		return fail(400, {
			message: "Invalid email",
			email,
		});
	}
	const user = getUserByEmail(email);
	if (!user || !user.email) {
		return fail(400, {
			message: "Account does not exist",
			email,
		});
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return fail(400, {
			message: "Too many requests",
			email,
		});
	}
	if (!userBucket.consume(user.id, 1)) {
		return fail(400, {
			message: "Too many requests",
			email,
		});
	}

	await invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = await createPasswordResetSession(sessionToken, user.id, user.email);
	await sendPasswordResetEmail(session.email, session.code);
	setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);
	return redirect(302, "/reset-password/verify-email");
}
