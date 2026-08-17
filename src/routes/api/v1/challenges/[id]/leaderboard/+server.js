import { getChallengeById } from "$lib/server/challenge";
import {
	getDailyChallengeEntryCount,
	getDailyChallengeLeaderboard,
	getDailyChallengeUserRank,
} from "$lib/server/leaderboard";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, params, url }) {
	const challenge = getChallengeById(params.id);
	if (!challenge) return err("Challenge not found", 404);

	const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100);
	const entries = getDailyChallengeLeaderboard(params.id, challenge.type, limit);
	const entryCount = getDailyChallengeEntryCount(params.id, challenge.type);

	let userRank = null;
	let userBestScore = null;
	if (locals.user) {
		const rank = getDailyChallengeUserRank(locals.user.id, params.id, challenge.type);
		userRank = rank?.rank ?? null;
		userBestScore = rank?.bestScore ?? null;
	}

	return ok({
		challenge,
		entries,
		entryCount,
		userRank,
		userBestScore,
	});
}
