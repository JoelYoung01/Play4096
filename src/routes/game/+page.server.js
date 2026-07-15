import { getCurrentGame, saveScore } from "$lib/server/game";
import { getUserProfile } from "$lib/server/user.js";
import { fail } from "@sveltejs/kit";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals }) {
	let user = null;
	let dbGame = null;

	if (locals.user) {
		user = getUserProfile(locals.user.id);
		dbGame = getCurrentGame(locals.user.id);
		if (dbGame) {
			dbGame = {
				id: dbGame.id,
				board: dbGame.board,
				score: dbGame.score ?? 0,
				seed: dbGame.seed ?? undefined,
				rngState: dbGame.rngState ?? undefined,
				moveCount: dbGame.moveCount ?? 0,
				undoCooldownRemaining: dbGame.undoCooldownRemaining ?? 0,
				moves: dbGame.moves ?? null,
				lastUpdated: dbGame.updatedOn.getTime(),
			};
		}
	}

	return {
		user,
		/** @type {import("$lib/types").GameState & { lastUpdated: number } | null} */
		dbGame,
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
