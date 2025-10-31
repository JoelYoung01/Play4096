import { getCurrentGame } from "$lib/server/game";
import { getUserProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals }) {
	let user = null;
	let hasDbGame = false;

	if (locals.user) {
		user = getUserProfile(locals.user.id);
		const dbGame = getCurrentGame(locals.user.id);
		hasDbGame = !!dbGame;
	}

	return {
		user,
		hasDbGame,
	};
}
