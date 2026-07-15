import { LEADERBOARD_PERIODS } from "$lib/leaderboardPeriods.js";
import { loadClassicPeriodLeaderboard } from "$lib/server/classicLeaderboardLoad.js";

/** @type {import("./$types").PageServerLoad} */
export async function load(event) {
	return loadClassicPeriodLeaderboard(event, LEADERBOARD_PERIODS.WEEKLY);
}
