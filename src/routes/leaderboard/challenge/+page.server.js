import { redirect } from "@sveltejs/kit";
import { dailyChallengeId, getChallengeDateString, parseChallengeDate } from "$lib/challenges.js";

/** Old challenge board URL — send people to the challenge-scoped leaderboard. */
/** @type {import("./$types").PageServerLoad} */
export async function load({ url }) {
	const today = getChallengeDateString();
	const requested = url.searchParams.get("date");
	const dateStr =
		requested && parseChallengeDate(requested) && requested <= today ? requested : today;
	redirect(302, `/challenges/${dailyChallengeId(dateStr)}/leaderboard`);
}
