import { getAllTimeLeaderboard, getAllTimeUserRank } from "$lib/server/leaderboard";
import { getUserProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals }) {
	let user = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
	}

	const leaderboard = getAllTimeLeaderboard();
	let userRank = null;
	/** @type {number | null} */
	let userBestScore = null;

	if (user) {
		const rankInfo = getAllTimeUserRank(user.id);
		if (rankInfo) {
			userRank = rankInfo.rank;
			userBestScore = rankInfo.bestScore;
		}
	}

	return {
		user,
		userRank,
		userBestScore,
		leaderboard,
	};
}
