import { err, ok } from "$lib/server/mobile/http";
import { getCurrentGame } from "$lib/server/game";
import { getActiveCheckpoint } from "$lib/server/checkpoint";
import { getBestWinStats } from "$lib/server/game";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) return err("Not logged in", 401);

	const game = getCurrentGame(locals.user.id);
	const checkpoint = game?.id
		? getActiveCheckpoint(locals.user.id, game.id)
		: null;
	const bestWin = getBestWinStats(locals.user.id);

	return ok({
		game: game
			? {
					...game,
					lastUpdated:
						game.updatedOn instanceof Date
							? game.updatedOn.getTime()
							: game.updatedOn ?? null,
				}
			: null,
		checkpoint,
		bestWin,
	});
}
