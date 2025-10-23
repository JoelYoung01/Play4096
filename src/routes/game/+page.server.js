import { saveScore } from "$lib/server/game";
import { requireLoginProfile } from "$lib/server/user.js";
import { fail } from "@sveltejs/kit";

/** @type {import("./$types").PageServerLoad} */
export function load() {
	const user = requireLoginProfile();

	// TODO: Load current game from db if user is logged in and pro

	return {
		user,

		/** @type {import("$lib/types").GameState?} */
		currentGame: null,
	};
}

export const actions = {
	saveScore: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: "Not logged in." });
		}

		const formData = await request.formData();
		const score = Number(formData.get("score"));
		await saveScore(score, locals.user.id);

		return { success: true };
	},
};
