import { err, ok } from "$lib/server/mobile/http";
import { getGameHistory } from "$lib/server/game";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, url }) {
	if (!locals.user) return err("Not logged in", 401);
	const user = getUser(locals.user.id);
	if (!user || user.level !== USER_LEVELS.PRO) {
		return err("Pro required", 403, { code: "PRO_REQUIRED" });
	}

	const sort = url.searchParams.get("sort") || "newest";
	const filter = url.searchParams.get("filter") || "all";
	const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
	const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

	const history = getGameHistory(locals.user.id, { sort, filter, limit, offset });
	return ok({ games: history });
}
