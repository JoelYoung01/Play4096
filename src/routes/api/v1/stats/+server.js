import { getUserPlayStats } from "$lib/server/stats";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals }) {
	if (!locals.user) return err("Not logged in", 401);
	const user = getUser(locals.user.id);
	if (!user || user.level !== USER_LEVELS.PRO) {
		return err("Pro required", 403, { code: "PRO_REQUIRED" });
	}
	const stats = getUserPlayStats(locals.user.id);
	return ok({ stats });
}
