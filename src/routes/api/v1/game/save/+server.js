import { saveGame } from "$lib/server/game";
import { err, ok, readJson } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) return err("Not logged in", 401);

	const game = await readJson(request);
	if (!game) return err("Game data is required");

	const gameId = await saveGame({ ...game, playerId: locals.user.id });
	return ok({ success: true, id: gameId });
}
