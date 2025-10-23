import { error, fail } from "@sveltejs/kit";
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
	const response = {
		expired: false,
		alreadyVerified: false,
		email: user.email,
	};

	if (user.emailVerified) {
		response.alreadyVerified = true;
	}
	if (!user.email) {
		return error(400, {
			message: "User email not found",
		});
	}

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		response.expired = true;
	} else {
		response.email = verificationRequest.email;
	}

	return response;
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
	const response = {
		verify: {
			message: "",
			success: false,
		},
	};

	if (event.locals.session === null || event.locals.user === null) {
		response.verify.message = "Not authenticated";
		return fail(401, response);
	}
	const user = getUser(event.locals.user.id);
	if (!user) {
		response.verify.message = "Not authenticated";
		return fail(401, response);
	}
	if (!bucket.check(user.id, 1)) {
		response.verify.message = "Too many requests";
		return fail(429, response);
	}

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		response.verify.message = "Not authenticated";
		return fail(401, response);
	}
	const formData = await event.request.formData();
	const code = formData.get("code");
	if (typeof code !== "string") {
		response.verify.message = "Invalid or missing fields";
		return fail(400, response);
	}
	if (code === "") {
		response.verify.message = "Enter your code";
		return fail(400, response);
	}
	if (!bucket.consume(event.locals.user.id, 1)) {
		response.verify.message = "Too many requests";
		return fail(400, response);
	}
	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(
			verificationRequest.userId,
			verificationRequest.email
		);
		await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		response.verify.message =
			"The verification code was expired. We sent another code to your inbox.";
		return response;
	}
	if (verificationRequest.code !== code) {
		response.verify.message = "Incorrect code.";
		return fail(400, response);
	}
	await deleteUserEmailVerificationRequest(event.locals.user.id);
	await invalidateUserPasswordResetSessions(event.locals.user.id);
	await updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email);
	deleteEmailVerificationRequestCookie(event);

	response.verify.success = true;
	return response;
}

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function resendEmail(event) {
	const response = {
		resend: {
			type: "",
			message: "",
		},
	};

	if (event.locals.session === null || event.locals.user === null) {
		response.resend.message = "Not authenticated";
		return fail(401, response);
	}
	if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
		response.resend.message = "Too many requests";
		return fail(429, response);
	}

	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		const user = getUser(event.locals.user.id);
		if (!user?.email) {
			response.resend.message = "User email not found";
			return fail(400, response);
		}
		if (user.emailVerified) {
			response.resend.message = "Forbidden";
			return fail(403, response);
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			response.resend.message = "Too many requests";
			return fail(429, response);
		}
		verificationRequest = await createEmailVerificationRequest(event.locals.user.id, user.email);
	} else {
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			response.resend.message = "Too many requests";
			return fail(429, response);
		}
		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			verificationRequest.email
		);
	}
	await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(event, verificationRequest);
	response.resend.type = "info";
	response.resend.message = "A new code was sent to your inbox.";
	return response;
}
