import { USER_LEVELS } from "$lib/constants.js";
import { CHALLENGES } from "$lib/challenges.js";
import { getChallengeStatsForUser } from "$lib/server/challenge.js";
import { getUserProfile } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals }) {
	let user = null;
	/** @type {Record<string, { bestStatus: string | null; attempts: number; wins: number }> | null} */
	let stats = null;

	if (locals.user) {
		user = getUserProfile(locals.user.id);
		if (user?.level === USER_LEVELS.PRO) {
			stats = getChallengeStatsForUser(user.id);
		}
	}

	return {
		user,
		isPro: user?.level === USER_LEVELS.PRO,
		challenges: CHALLENGES,
		stats,
	};
}
