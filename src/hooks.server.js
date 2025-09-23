import { sequence } from "@sveltejs/kit/hooks";
import { isRedirect, isHttpError, isActionFailure } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { handleRR } from "$lib/server/rr";
import { getLogger, withRequestContext } from "$lib/server/requestContext.js";

/** @type {import('@sveltejs/kit').Handle} */
export const handleLogging = async ({ event, resolve }) => {
	return withRequestContext(event.request, async () => {
		const log = getLogger();
		const start = performance.now();
		try {
			const response = await resolve(event);
			log.info(
				{ status: response.status, durationMs: Math.round(performance.now() - start) },
				"request"
			);
			return response;
		} catch (err) {
			const durationMs = Math.round(performance.now() - start);
			if (isRedirect(err)) {
				// Redirects are control flow; do not log as errors
				throw err;
			}
			if (isHttpError(err)) {
				const level = err.status >= 500 ? "error" : "warn";
				log[level]({ err, status: err.status, durationMs }, "http error");
				throw err;
			}
			if (isActionFailure(err)) {
				log.error({ err, durationMs }, "action error");
				throw err;
			}

			log.error({ err, durationMs }, "unhandled error");
			throw err;
		}
	});
};

/** @type {import('@sveltejs/kit').Handle} */
const handleAuth = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const checkSus = async ({ event, resolve }) => {
	handleRR(event.url.pathname);
	return await resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
export const handle = sequence(handleLogging, checkSus, handleAuth);
