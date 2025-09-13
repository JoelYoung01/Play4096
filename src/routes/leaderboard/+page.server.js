import { getAllTimeLeaderboard, getAllTimeUserRank } from "$lib/server/leaderboard";
import { getUser } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals }) {
	const leaderboard = await getAllTimeLeaderboard();
	const user = getUser(locals.user?.id);
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
