import { json } from "@sveltejs/kit";
import { saveGame } from "$lib/server/game";

/** @type {import("./$types").RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: "Not logged in" }, { status: 401 });
	}

	const game = await request.json();
	if (!game) {
		return json({ error: "Game data is required" }, { status: 400 });
	}

	const gameId = await saveGame({ ...game, playerId: locals.user.id });

	return json({ success: true, id: gameId });
}
