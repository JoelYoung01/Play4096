import { json } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants";
import { restoreCheckpoint } from "$lib/server/checkpoint";
import { getUser } from "$lib/server/user";

/**
 * @param {unknown} error
 * @returns {{ message: string, status: number, code?: string }}
 */
function normalizeError(error) {
	const status = /** @type {{ status?: number }} */ (error)?.status ?? 500;
	const code = /** @type {{ code?: string }} */ (error)?.code;
	const message = error instanceof Error ? error.message : "Failed to restore checkpoint";
	return { message, status, code };
}

/** @type {import("./$types").RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: "Not logged in" }, { status: 401 });
	}

	const user = getUser(locals.user.id);
	if (!user || user.level !== USER_LEVELS.PRO) {
		return json({ error: "Checkpoints are a Pro feature", code: "PRO_REQUIRED" }, { status: 403 });
	}

	const body = await request.json();
	if (!body?.gameId) {
		return json({ error: "gameId is required" }, { status: 400 });
	}

	try {
		const game = await restoreCheckpoint(locals.user.id, body.gameId);
		return json({ success: true, game });
	} catch (error) {
		const { message, status, code } = normalizeError(error);
		return json({ error: message, code }, { status });
	}
}
