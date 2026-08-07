import { CHALLENGE_RUN_STATUS } from "$lib/challenges.js";
import { completeChallengeRun } from "$lib/server/challenge";
import { err, ok, readJson } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.runId) return err("runId is required");
	if (body.status !== CHALLENGE_RUN_STATUS.WON && body.status !== CHALLENGE_RUN_STATUS.LOST) {
		return err("status must be won or lost");
	}
	if (typeof body.score !== "number") return err("score is required");

	try {
		const run = await completeChallengeRun(body.runId, locals.user.id, {
			status: body.status,
			score: body.score,
			metrics: body.metrics ?? {},
		});
		return ok({ run });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Complete failed";
		return err(message, 400);
	}
}
