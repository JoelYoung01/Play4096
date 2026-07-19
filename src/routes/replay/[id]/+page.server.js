import { error, redirect } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants";
import { gameHasReplay, gameHistoryStatus, getOwnedGameById } from "$lib/server/game";
import { requireLoginProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export function load({ params }) {
	const user = requireLoginProfile();

	if (user.level !== USER_LEVELS.PRO) {
		redirect(302, "/stripe");
	}

	const game = getOwnedGameById(params.id, user.id);
	if (!game) {
		error(404, "Game not found");
	}

	const hasReplay = gameHasReplay({
		seed: game.seed,
		moves: game.moves,
		moveCount: game.moveCount,
	});

	if (!hasReplay || game.seed == null || !Array.isArray(game.moves)) {
		error(400, "This game cannot be replayed");
	}

	return {
		user,
		replay: {
			id: game.id,
			score: game.score ?? 0,
			won: game.won,
			complete: game.complete,
			status: gameHistoryStatus(game.complete),
			moveCount: game.moveCount,
			seed: game.seed,
			moves: game.moves,
			completedOn: game.completedOn,
			updatedOn: game.updatedOn,
		},
	};
}
