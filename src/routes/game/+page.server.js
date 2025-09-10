import { getUserProfile } from "$lib/server/user";
import { saveScore } from "$lib/server/game";
import { fail } from "@sveltejs/kit";

export function load({ locals }) {
	let bestScore = 0;

	// Load current user's best score
	if (locals.user) {
		const userProfile = getUserProfile(locals.user.id);
		bestScore = userProfile?.bestScore ?? 0;
	}

	return {
		user: locals.user,
		bestScore,

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
