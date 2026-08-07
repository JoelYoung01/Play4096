import * as auth from "$lib/server/auth";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals }) {
	if (!locals.session) {
		return err("Not logged in", 401);
	}
	await auth.invalidateSession(locals.session.id);
	return ok({ success: true });
}
