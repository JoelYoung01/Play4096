import { error, fail, redirect } from "@sveltejs/kit";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie,
} from "$lib/server/auth/emailVerification";
import { invalidateUserPasswordResetSessions } from "$lib/server/auth/resetPassword";
import { updateUserEmailAndSetEmailAsVerified } from "$lib/server/auth/user";
import { ExpiringTokenBucket } from "$lib/server/auth/rateLimit";
import { getUser, requireLogin } from "$lib/server/user";

/** @param {import("@sveltejs/kit").RequestEvent} event */
export async function load(event) {
	const user = requireLogin();

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		if (user.emailVerified) {
			return redirect(302, "/");
		}
		if (!user.email) {
			return error(400, {
				message: "User email not found",
			});
		}
		// Note: We don't need rate limiting since it takes time before requests expire
		verificationRequest = await createEmailVerificationRequest(user.id, user.email);
		await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
	}
	return {
		email: verificationRequest.email,
	};
}

/** @type {import("$lib/server/auth/rateLimit").ExpiringTokenBucket<string>} */
const bucket = new ExpiringTokenBucket(5, 60 * 30);

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	verify: verifyCode,
	resend: resendEmail,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function verifyCode(event) {
	if (event.locals.session === null || event.locals.user === null) {
		return fail(401, {
			verify: {
				message: "Not authenticated",
			},
		});
	}
	const user = getUser(event.locals.user.id);
	if (!user) {
		return fail(401, {
			verify: {
				message: "Not authenticated",
			},
		});
	}
	if (!bucket.check(user.id, 1)) {
		return fail(429, {
			verify: {
				message: "Too many requests",
			},
		});
	}

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		return fail(401, {
			verify: {
				message: "Not authenticated",
			},
		});
	}
	const formData = await event.request.formData();
	const code = formData.get("code");
	if (typeof code !== "string") {
		return fail(400, {
			verify: {
				message: "Invalid or missing fields",
			},
		});
	}
	if (code === "") {
		return fail(400, {
			verify: {
				message: "Enter your code",
			},
		});
	}
	if (!bucket.consume(event.locals.user.id, 1)) {
		return fail(400, {
			verify: {
				message: "Too many requests",
			},
		});
	}
	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(
			verificationRequest.userId,
			verificationRequest.email
		);
		await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		return {
			verify: {
				message: "The verification code was expired. We sent another code to your inbox.",
			},
		};
	}
	if (verificationRequest.code !== code) {
		return fail(400, {
			verify: {
				message: "Incorrect code.",
			},
		});
	}
	await deleteUserEmailVerificationRequest(event.locals.user.id);
	await invalidateUserPasswordResetSessions(event.locals.user.id);
	await updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email);
	deleteEmailVerificationRequestCookie(event);
	return redirect(302, "/");
}

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function resendEmail(event) {
	if (event.locals.session === null || event.locals.user === null) {
		return fail(401, {
			resend: {
				message: "Not authenticated",
			},
		});
	}
	if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
		return fail(429, {
			resend: {
				message: "Too many requests",
			},
		});
	}

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		const user = getUser(event.locals.user.id);
		if (!user?.email) {
			return fail(400, {
				message: "User email not found",
			});
		}
		if (user.emailVerified) {
			return fail(403, {
				resend: {
					message: "Forbidden",
				},
			});
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			return fail(429, {
				resend: {
					message: "Too many requests",
				},
			});
		}
		verificationRequest = await createEmailVerificationRequest(event.locals.user.id, user.email);
	} else {
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			return fail(429, {
				resend: {
					message: "Too many requests",
				},
			});
		}
		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			verificationRequest.email
		);
	}
	await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(event, verificationRequest);
	return {
		resend: {
			message: "A new code was sent to your inbox.",
		},
	};
}
