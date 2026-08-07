import { err, ok } from "$lib/server/mobile/http";
import { buildUserPayload, issueTokenResponse } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, request }) {
	if (!locals.user) {
		return err("Not logged in", 401);
	}
	const user = buildUserPayload(locals.user.id);
	if (!user) return err("User not found", 404);

	const header = request.headers.get("authorization");
	const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
	const accessToken = match?.[1]?.trim() ?? null;

	if (accessToken) {
		return ok({
			access_token: accessToken,
			expires_at: locals.session?.expiresAt?.toISOString?.() ?? null,
			user,
		});
	}

	// Cookie session — mint a bearer token the mobile client can store.
	const token = await issueTokenResponse(locals.user.id);
	return ok(token);
}
