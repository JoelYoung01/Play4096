import { sequence } from "@sveltejs/kit/hooks";
import { isRedirect, isHttpError, isActionFailure } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { handleRR } from "$lib/server/rr";
import { getLogger, withRequestContext } from "$lib/server/requestContext.js";
import { basicLogger } from "$lib/server/logger.js";
import { env } from "$env/dynamic/private";

/**
 * Drop oversized `Link` preload headers before they hit a reverse proxy.
 *
 * SvelteKit SSR responses (especially `/game` and challenge play) emit a large
 * `Link: … rel=modulepreload` list. Authenticated responses also refresh the
 * session `Set-Cookie`. Together those headers often exceed nginx's default
 * `proxy_buffer_size` (~4kb), which surfaces as **502 Bad Gateway**
 * (`upstream sent too big header`) — commonly noticed after challenge complete
 * when the play page is re-rendered. See sveltejs/kit#11084.
 *
 * Keep small Link headers (early hints still help); strip once they crowd the
 * proxy buffer when combined with cookies and other response headers.
 */
const LINK_HEADER_MAX_LEN = 2048;

/** @type {import('@sveltejs/kit').Handle} */
const handleProxySafeHeaders = async ({ event, resolve }) => {
	const response = await resolve(event);
	const link = response.headers.get("link");
	if (link && link.length > LINK_HEADER_MAX_LEN) {
		response.headers.delete("link");
	}
	return response;
};

/** @type {import('@sveltejs/kit').Handle} */
export const handleLogging = async ({ event, resolve }) => {
	return withRequestContext(event.request, async () => {
		// Skip logging for data.json requests
		if (event.request.url.includes("__data.json")) {
			return await resolve(event);
		}

		const log = getLogger();
		const start = performance.now();
		try {
			const response = await resolve(event);
			const { pathname } = new URL(event.request.url);
			const durationMs = Math.round(performance.now() - start);
			const msg = `[request] ${event.request.method}:${response.status} ${pathname} ${durationMs}ms`;

			if (env.LOG_FULL_REQUEST === "true") {
				log.info({ status: response.status, durationMs }, msg);
			} else {
				basicLogger.info(msg);
			}

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

/**
 * Prefer Authorization: Bearer for mobile / API clients; fall back to cookie sessions.
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function getSessionTokenFromRequest(event) {
	const header = event.request.headers.get("authorization");
	if (header) {
		const match = /^Bearer\s+(.+)$/i.exec(header.trim());
		if (match?.[1]) return match[1].trim();
	}
	return event.cookies.get(auth.sessionCookieName) ?? null;
}

/** @type {import('@sveltejs/kit').Handle} */
const handleAuth = async ({ event, resolve }) => {
	const sessionToken = getSessionTokenFromRequest(event);
	const usedBearer = Boolean(event.request.headers.get("authorization"));

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session && !usedBearer) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else if (!session && !usedBearer) {
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
export const handle = sequence(handleProxySafeHeaders, handleLogging, checkSus, handleAuth);
