import { getCurrentGame, saveScore } from "$lib/server/game";
import { getUserProfile } from "$lib/server/user.js";
import { fail } from "@sveltejs/kit";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals }) {
	let user = null;
	let currentGame = null;

	if (locals.user) {
		user = getUserProfile(locals.user.id);
		const dbGame = getCurrentGame(locals.user.id);
		if (dbGame) {
			currentGame = {
				id: dbGame.id,
				board: dbGame.board,
				score: dbGame.score ?? 0,
			};
		}
	}

	return {
		user,
		/** @type {import("$lib/types").GameState?} */
		currentGame,
	};
}

/** @type {import("./$types").Actions} */
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
