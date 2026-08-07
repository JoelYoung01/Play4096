import { ok } from "$lib/server/mobile/http";
import { getIapConfig } from "$lib/server/mobile/storekit";
import { USER_LEVELS } from "$lib/constants";
import { getUser } from "$lib/server/user";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals }) {
	const { productId, bundleId } = getIapConfig();
	const user = locals.user ? getUser(locals.user.id) : null;
	return ok({
		productId,
		bundleId,
		isPro: user?.level === USER_LEVELS.PRO,
	});
}
