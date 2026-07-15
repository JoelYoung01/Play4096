import { redirect } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants.js";
import {
	dateFromChallengeId,
	formatChallengeOverview,
	formatChallengeTypeLabel,
	getChallengeDateString,
} from "$lib/challenges.js";
import { getChallengeById } from "$lib/server/challenge.js";
import {
	getDailyChallengeLeaderboard,
	getDailyChallengeUserRank,
} from "$lib/server/leaderboard.js";
import { getUserProfile } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals, params }) {
	const challenge = getChallengeById(params.id);
	if (!challenge) {
		redirect(302, "/challenges");
	}

	const dateStr = dateFromChallengeId(challenge.id);
	const today = getChallengeDateString();
	const isToday = dateStr === today;
	const isPast = dateStr != null && dateStr < today;

	let user = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
	}
	const isPro = user?.level === USER_LEVELS.PRO;

	// Match challenge detail: past days stay Pro-locked.
	if (isPast && !isPro) {
		redirect(302, `/challenges/${challenge.id}`);
	}

	const leaderboard = getDailyChallengeLeaderboard(challenge.id, challenge.type);
	let userRank = null;
	/** @type {number | null} */
	let userBestScore = null;
	if (user) {
		const rankInfo = getDailyChallengeUserRank(user.id, challenge.id, challenge.type);
		if (rankInfo) {
			userRank = rankInfo.rank;
			userBestScore = rankInfo.bestScore;
		}
	}

	return {
		user,
		isPro,
		isToday,
		challenge,
		overview: formatChallengeOverview(challenge),
		typeLabel: formatChallengeTypeLabel(challenge.type),
		dateStr,
		leaderboard,
		userRank,
		userBestScore,
	};
}
