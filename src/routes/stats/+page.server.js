import { USER_LEVELS } from "$lib/constants";
import { getUserPlayStats } from "$lib/server/stats";
import { getUserProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals }) {
	const user = locals.user ? getUserProfile(locals.user.id) : null;
	const isPro = user?.level === USER_LEVELS.PRO;
	const stats = isPro && user ? getUserPlayStats(user.id) : null;

	return {
		user,
		isPro,
		stats,
	};
}
