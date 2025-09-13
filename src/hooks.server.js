import * as auth from "$lib/server/auth";
import { handleRR } from "$lib/server/rr";

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
export async function handle({ event, resolve }) {
	// Do some funny stuff
	handleRR(event.url.pathname);

	return await handleAuth({ event, resolve });
}
