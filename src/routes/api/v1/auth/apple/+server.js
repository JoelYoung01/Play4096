import { err, ok, readJson } from "$lib/server/mobile/http";
import { getOrCreateOAuthUser, verifyAppleIdentityToken } from "$lib/server/mobile/oauth";
import { issueTokenResponse } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request }) {
	const body = await readJson(request);
	if (!body?.identity_token) {
		return err("identity_token is required");
	}

	try {
		const apple = await verifyAppleIdentityToken(body.identity_token);
		const fullName =
			typeof body.full_name === "string" && body.full_name.trim()
				? body.full_name.trim()
				: null;
		const userId = await getOrCreateOAuthUser({
			provider: "apple",
			providerUserId: apple.sub,
			email: apple.email,
			emailVerified: apple.emailVerified,
			displayName: fullName,
		});
		const token = await issueTokenResponse(userId);
		return ok(token);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Apple sign-in failed";
		return err(message, 401);
	}
}
