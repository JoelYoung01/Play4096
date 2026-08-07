import {
	getAllTimeLeaderboard,
	getAllTimeUserRank,
} from "$lib/server/leaderboard";
import { ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, url }) {
	const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100);
	const entries = getAllTimeLeaderboard(limit);
	let userRank = null;
	let userBestScore = null;
	if (locals.user) {
		const rank = getAllTimeUserRank(locals.user.id);
		userRank = rank?.rank ?? null;
		userBestScore = rank?.bestScore ?? null;
	}
	return ok({ entries, userRank, userBestScore, period: "all-time" });
}
