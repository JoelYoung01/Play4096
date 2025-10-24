import { getAllTimeLeaderboard, getAllTimeUserRank } from "$lib/server/leaderboard";
import { getUserProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals }) {
	let user = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
	}

	const leaderboard = await getAllTimeLeaderboard();
	let userRank = null;

	if (user) {
		userRank = await getAllTimeUserRank(user.id);
	}

	return {
		user,
		userRank,
		leaderboard,
	};
}
