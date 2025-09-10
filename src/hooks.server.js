import * as auth from "$lib/server/auth";

/**
 * Handle Authentication
 * @param {{ event: import("@sveltejs/kit").RequestEvent, resolve: (event: import("@sveltejs/kit").RequestEvent) => Promise<Response> }} param0
 * @returns
 */
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

export const handle = handleAuth;
