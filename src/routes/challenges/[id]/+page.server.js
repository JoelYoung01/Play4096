import { fail, redirect } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants.js";
import { getChallengeById, formatChallengeObjective } from "$lib/challenges.js";
import { getChallengeStatsForUser, startChallengeRun } from "$lib/server/challenge.js";
import { getUserProfile, requireLogin } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals, params }) {
	const challenge = getChallengeById(params.id);
	if (!challenge) {
		redirect(302, "/challenges");
	}

	let user = null;
	let stats = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
		if (user?.level === USER_LEVELS.PRO) {
			stats = getChallengeStatsForUser(user.id)?.[challenge.id] ?? null;
		}
	}

	return {
		user,
		isPro: user?.level === USER_LEVELS.PRO,
		challenge,
		objective: formatChallengeObjective(challenge),
		stats,
	};
}

/** @type {import("./$types").Actions} */
export const actions = {
	start: async ({ params }) => {
		const user = requireLogin(`/challenges/${params.id}`);

		if (user.level !== USER_LEVELS.PRO) {
			redirect(303, "/stripe");
		}

		const challenge = getChallengeById(params.id);
		if (!challenge) {
			return fail(404, { error: "Challenge not found" });
		}

		const run = await startChallengeRun(user.id, challenge.id);
		redirect(303, `/challenges/${challenge.id}/play?run=${run.id}`);
	},
};
