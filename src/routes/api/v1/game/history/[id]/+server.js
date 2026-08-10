import { err, ok } from "$lib/server/mobile/http";
import { getOwnedGameById, gameHasReplay, replayUnavailableReason } from "$lib/server/game";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, params }) {
	if (!locals.user) return err("Not logged in", 401);
	const user = getUser(locals.user.id);
	if (!user || user.level !== USER_LEVELS.PRO) {
		return err("Pro required", 403, { code: "PRO_REQUIRED" });
	}

	const game = getOwnedGameById(params.id, locals.user.id);
	if (!game) return err("Game not found", 404);

	return ok({
		game,
		replayable: gameHasReplay(game),
		replayUnavailableReason: replayUnavailableReason(game),
	});
}
