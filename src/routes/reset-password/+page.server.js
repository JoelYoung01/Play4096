import { fail, redirect } from "@sveltejs/kit";
import { verifyPasswordStrength } from "$lib/server/auth/password";
import { updateUserPassword } from "$lib/server/auth/user";
import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest,
} from "$lib/server/auth/resetPassword";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie,
} from "$lib/server/auth/session";

/** @param {import("@sveltejs/kit").RequestEvent} event */
export async function load(event) {
	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		console.debug("No session found");
		return redirect(302, "/forgot-password");
	}
	if (!session.emailVerified) {
		console.debug("Email not verified");
		return redirect(302, "/reset-password/verify-email");
	}
	return {};
}

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	default: action,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function action(event) {
	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(event);

	if (passwordResetSession === null || !user) {
		return fail(401, {
			message: "Not authenticated",
		});
	}
	if (!passwordResetSession.emailVerified) {
		return fail(403, {
			message: "Forbidden",
		});
	}
	const formData = await event.request.formData();
	const password = formData.get("password");
	if (typeof password !== "string") {
		return fail(400, {
			message: "Invalid or missing fields",
		});
	}

	const problems = await verifyPasswordStrength(password);
	if (problems.length > 0) {
		return fail(400, {
			message: problems.join(", "),
		});
	}
	await invalidateUserPasswordResetSessions(passwordResetSession.userId);
	await invalidateUserSessions(passwordResetSession.userId);
	await updateUserPassword(passwordResetSession.userId, password);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);
	deletePasswordResetSessionTokenCookie(event);
	return redirect(302, "/");
}
