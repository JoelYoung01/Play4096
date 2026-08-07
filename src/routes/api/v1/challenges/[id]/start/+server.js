import { dateFromChallengeId, getChallengeDateString } from "$lib/challenges.js";
import { getChallengeById, startChallengeRun } from "$lib/server/challenge";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, params }) {
	if (!locals.user) return err("Not logged in", 401);

	const user = getUser(locals.user.id);
	if (!user || user.level !== USER_LEVELS.PRO) {
		return err("Pro required", 403, { code: "PRO_REQUIRED" });
	}

	const challenge = getChallengeById(params.id);
	if (!challenge) return err("Challenge not found", 404);

	const dateStr = dateFromChallengeId(params.id);
	const today = getChallengeDateString();
	if (dateStr && dateStr > today) {
		return err("Challenge not available yet", 400);
	}

	const run = await startChallengeRun(locals.user.id, params.id);
	return ok({ runId: run.id, challenge });
}
