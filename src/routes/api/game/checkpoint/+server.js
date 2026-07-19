import { json } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants";
import { getActiveCheckpoint, setCheckpoint } from "$lib/server/checkpoint";
import { getUser } from "$lib/server/user";

/**
 * @param {unknown} error
 * @returns {{ message: string, status: number, code?: string }}
 */
function normalizeError(error) {
	const status = /** @type {{ status?: number }} */ (error)?.status ?? 500;
	const code = /** @type {{ code?: string }} */ (error)?.code;
	const message = error instanceof Error ? error.message : "Failed to process checkpoint request";
	return { message, status, code };
}

/** @type {import("./$types").RequestHandler} */
export async function GET({ url, locals }) {
	if (!locals.user) {
		return json({ error: "Not logged in" }, { status: 401 });
	}

	const gameId = url.searchParams.get("gameId");
	if (!gameId) {
		return json({ error: "gameId is required" }, { status: 400 });
	}

	const checkpoint = getActiveCheckpoint(locals.user.id, gameId);
	return json({ checkpoint });
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
	if (!body?.gameId || !body?.board || typeof body.score !== "number") {
		return json({ error: "gameId, board, and score are required" }, { status: 400 });
	}

	try {
		const checkpoint = await setCheckpoint(locals.user.id, {
			gameId: body.gameId,
			board: body.board,
			score: body.score,
			seed: body.seed,
			rngState: body.rngState,
			moveCount: body.moveCount,
			undoCooldownRemaining: body.undoCooldownRemaining,
			won: body.won,
			moves: body.moves,
		});
		return json({ success: true, checkpoint });
	} catch (error) {
		const { message, status, code } = normalizeError(error);
		return json({ error: message, code }, { status });
	}
}
