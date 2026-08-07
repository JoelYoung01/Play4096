import { dateFromChallengeId, getChallengeDateString } from "$lib/challenges.js";
import { getChallengeById, getChallengeStatsForUser } from "$lib/server/challenge";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, params }) {
	const challenge = getChallengeById(params.id);
	if (!challenge) return err("Challenge not found", 404);

	const dateStr = dateFromChallengeId(params.id);
	const today = getChallengeDateString();
	const user = locals.user ? getUser(locals.user.id) : null;
	const isPro = user?.level === USER_LEVELS.PRO;
	const isPast = Boolean(dateStr && dateStr < today);
	const locked = isPast && !isPro;

	let userStats = null;
	if (locals.user && !locked) {
		const map = getChallengeStatsForUser(locals.user.id, [params.id]);
		userStats = map[params.id] ?? null;
	}

	return ok({
		challenge,
		date: dateStr,
		isPast,
		locked,
		isPro,
		userStats,
	});
}
