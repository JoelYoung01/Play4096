import { getAllTimeLeaderboard, getAllTimeUserRank } from "$lib/server/leaderboard";
import { requireLoginProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export async function load() {
	const user = requireLoginProfile();

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
