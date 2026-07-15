import { getChallengeDateString, parseChallengeDate } from "$lib/challenges.js";
import { ensureDailyChallenge, getChallengeById } from "$lib/server/challenge.js";
import {
	getDailyChallengeLeaderboard,
	getDailyChallengeUserRank,
} from "$lib/server/leaderboard.js";
import { getUserProfile } from "$lib/server/user";
import { redirect } from "@sveltejs/kit";

/**
 * Shift a YYYY-MM-DD civil date by a number of days.
 * @param {string} dateStr
 * @param {number} deltaDays
 */
function shiftDate(dateStr, deltaDays) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) return null;
	const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + deltaDays));
	return utc.toISOString().slice(0, 10);
}

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals, url }) {
	const today = getChallengeDateString();
	const requested = url.searchParams.get("date");
	let dateStr = today;

	if (requested) {
		if (!parseChallengeDate(requested) || requested > today) {
			redirect(302, "/leaderboard/challenge");
		}
		dateStr = requested;
	}

	const challenge = ensureDailyChallenge(dateStr);
	const loaded = getChallengeById(challenge.id);
	if (!loaded) {
		redirect(302, "/leaderboard");
	}

	let user = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
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

	const prevDate = shiftDate(dateStr, -1);
	const nextDate = dateStr < today ? shiftDate(dateStr, 1) : null;

	return {
		user,
		userRank,
		userBestScore,
		leaderboard,
		challenge,
		dateStr,
		isToday: dateStr === today,
		prevDate,
		nextDate,
	};
}
