import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { deleteUser, getUser } from "$lib/server/user";

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
	resendVerificationEmail: async (event) => {
		const response = {
			sendEmail: {
				success: false,
				message: "",
			},
		};

		if (event.locals.session === null || event.locals.user === null) {
			response.sendEmail.message = "Not authenticated";
			return fail(401, response);
		}
		if (!auth.sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			response.sendEmail.message = "Too many requests";
			return fail(429, response);
		}

		let verificationRequest = auth.getUserEmailVerificationRequestFromRequest(event);
		if (verificationRequest === null) {
			const user = getUser(event.locals.user.id);
			if (!user?.email) {
				response.sendEmail.message = "User email not found";
				return fail(400, response);
			}
			if (user.emailVerified) {
				response.sendEmail.message = "Forbidden";
				return fail(403, response);
			}
			if (!auth.sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				response.sendEmail.message = "Too many requests";
				return fail(429, response);
			}
			verificationRequest = await auth.createEmailVerificationRequest(
				event.locals.user.id,
				user.email
			);
		} else {
			if (!auth.sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				response.sendEmail.message = "Too many requests";
				return fail(429, response);
			}
			verificationRequest = await auth.createEmailVerificationRequest(
				event.locals.user.id,
				verificationRequest.email
			);
		}
		await auth.sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		auth.setEmailVerificationRequestCookie(event, verificationRequest);
		response.sendEmail.success = true;
		return response;
	},
};
