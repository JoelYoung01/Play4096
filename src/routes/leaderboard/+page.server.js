import { getAllTimeLeaderboard } from "$lib/server/leaderboard";

export async function load() {
	const leaderboard = await getAllTimeLeaderboard();

	return {
		leaderboard,
	};
}
