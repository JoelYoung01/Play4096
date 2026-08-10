import {
	deactivateCheckpoint,
	getActiveCheckpoint,
	setCheckpoint,
} from "$lib/server/checkpoint";
import { err, ok, readJson } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, url }) {
	if (!locals.user) return err("Not logged in", 401);
	const gameId = url.searchParams.get("gameId");
	if (!gameId) return err("gameId is required");
	const checkpoint = getActiveCheckpoint(locals.user.id, gameId);
	return ok({ checkpoint });
}

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.gameId) return err("gameId is required");

	try {
		const checkpoint = await setCheckpoint(locals.user.id, body);
		return ok({ success: true, checkpoint });
	} catch (e) {
		const status = /** @type {{ status?: number, code?: string, message?: string }} */ (e);
		return err(status.message || "Checkpoint failed", status.status || 500, {
			code: status.code,
		});
	}
}

/** @type {import("./$types").RequestHandler} */
export async function DELETE({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.checkpointId) return err("checkpointId is required");

	try {
		const deactivated = deactivateCheckpoint(locals.user.id, body.checkpointId);
		return ok({ success: true, deactivated });
	} catch (e) {
		const status = /** @type {{ status?: number, message?: string }} */ (e);
		return err(status.message || "Failed to clear checkpoint", status.status || 500);
	}
}
