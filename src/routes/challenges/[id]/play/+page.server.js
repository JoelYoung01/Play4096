import { error, fail, redirect } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants.js";
import {
	CHALLENGE_RUN_STATUS,
	dateFromChallengeId,
	formatChallengeObjective,
	getChallengeDateString,
} from "$lib/challenges.js";
import {
	completeChallengeRun,
	getChallengeById,
	getChallengeRun,
	startChallengeRun,
} from "$lib/server/challenge.js";
import { requireLogin } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ params, url }) {
	const user = requireLogin(`/challenges/${params.id}/play`);

	if (user.level !== USER_LEVELS.PRO) {
		redirect(302, "/stripe");
	}

	const challenge = getChallengeById(params.id);
	if (!challenge) {
		redirect(302, "/challenges");
	}

	const runId = url.searchParams.get("run");
	if (!runId) {
		redirect(302, `/challenges/${challenge.id}`);
	}

	const run = getChallengeRun(runId, user.id);
	if (!run || run.challengeId !== challenge.id) {
		error(404, "Challenge run not found");
	}

	return {
		challenge,
		objective: formatChallengeObjective(challenge),
		run: {
			id: run.id,
			status: run.status,
			score: run.score,
			startedOn: run.startedOn instanceof Date ? run.startedOn.getTime() : Number(run.startedOn),
			metrics: run.metrics ?? {},
		},
	};
}

/** @type {import("./$types").Actions} */
export const actions = {
	/** Start a fresh run (Retry) — redirects to this play page with the new run id. */
	start: async ({ params }) => {
		const user = requireLogin(`/challenges/${params.id}/play`);

		if (user.level !== USER_LEVELS.PRO) {
			redirect(303, "/stripe");
		}

		const challenge = getChallengeById(params.id);
		if (!challenge) {
			return fail(404, { error: "Challenge not found" });
		}

		const dateStr = dateFromChallengeId(challenge.id);
		const today = getChallengeDateString();
		if (dateStr && dateStr > today) {
			return fail(400, { error: "Challenge not available yet" });
		}

		const run = await startChallengeRun(user.id, challenge.id);
		redirect(303, `/challenges/${challenge.id}/play?run=${run.id}`);
	},

	complete: async ({ request, params }) => {
		const user = requireLogin(`/challenges/${params.id}/play`);

		if (user.level !== USER_LEVELS.PRO) {
			return fail(403, { error: "Pro required" });
		}

		const formData = await request.formData();
		const runId = String(formData.get("runId") ?? "");
		const status = String(formData.get("status") ?? "");
		const score = Number(formData.get("score") ?? 0);
		let metrics = {};
		try {
			metrics = JSON.parse(String(formData.get("metrics") ?? "{}"));
		} catch {
			metrics = {};
		}

		if (!runId) {
			return fail(400, { error: "Missing run id" });
		}

		if (status !== CHALLENGE_RUN_STATUS.WON && status !== CHALLENGE_RUN_STATUS.LOST) {
			return fail(400, { error: "Invalid status" });
		}

		const run = getChallengeRun(runId, user.id);
		if (!run || run.challengeId !== params.id) {
			return fail(404, { error: "Run not found" });
		}

		const updated = await completeChallengeRun(runId, user.id, {
			status,
			score: Number.isFinite(score) ? score : 0,
			metrics,
		});

		return {
			success: true,
			status: updated?.status,
		};
	},
};
