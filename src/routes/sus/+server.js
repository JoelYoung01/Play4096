import { json } from "@sveltejs/kit";
import { getLogger } from "$lib/server/requestContext.js";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const body = await request.json();
	const log = getLogger();
	log.info({ details: body }, "Sus request detected");

	return json({
		message: "Sus request logged.",
		redirectUrl: "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1",
	});
}
