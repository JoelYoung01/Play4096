import { err, ok } from "$lib/server/mobile/http";
import { rotateRefreshToken } from "$lib/server/auth/refresh.js";
import { buildUserPayload } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return err("Invalid JSON body", 400);
	}

	const refreshToken =
		typeof body?.refresh_token === "string" ? body.refresh_token.trim() : "";
	if (!refreshToken) {
		return err("refresh_token is required", 400);
	}

	const rotated = await rotateRefreshToken(refreshToken);
	if (!rotated) {
		return err("Invalid or expired refresh token", 401);
	}

	const user = buildUserPayload(rotated.session.userId);
	if (!user) {
		return err("User not found", 404);
	}

	return ok({
		access_token: rotated.accessToken,
		expires_at: rotated.session.expiresAt.toISOString(),
		refresh_token: rotated.refreshToken,
		refresh_expires_at: rotated.refresh.expiresAt.toISOString(),
		user,
	});
}
