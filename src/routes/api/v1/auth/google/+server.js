import { err, ok, readJson } from "$lib/server/mobile/http";
import { getOrCreateOAuthUser, verifyGoogleIdToken } from "$lib/server/mobile/oauth";
import { issueTokenResponse } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request }) {
	const body = await readJson(request);
	if (!body?.credential) {
		return err("credential is required");
	}

	try {
		const google = await verifyGoogleIdToken(body.credential);
		const userId = await getOrCreateOAuthUser({
			provider: "google",
			providerUserId: google.sub,
			email: google.email,
			emailVerified: google.emailVerified,
			displayName: google.name ?? null,
		});
		const token = await issueTokenResponse(userId);
		return ok(token);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Google sign-in failed";
		return err(message, 401);
	}
}
