import { restoreCheckpoint } from "$lib/server/checkpoint";
import { err, ok, readJson } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.gameId) return err("gameId is required");

	try {
		const game = await restoreCheckpoint(locals.user.id, body.gameId);
		return ok({ success: true, game });
	} catch (e) {
		const status = /** @type {{ status?: number, code?: string, message?: string }} */ (e);
		return err(status.message || "Restore failed", status.status || 500, {
			code: status.code,
		});
	}
}
