import { USER_LEVELS } from "$lib/constants";
import { getGameHistory } from "$lib/server/game";
import { getUserProfile } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export function load({ locals, url }) {
	const user = locals.user ? getUserProfile(locals.user.id) : null;
	const isPro = user?.level === USER_LEVELS.PRO;

	/** @type {import("$lib/types").GameHistorySort} */
	const sortParam = /** @type {import("$lib/types").GameHistorySort} */ (
		url.searchParams.get("sort")
	);
	/** @type {import("$lib/types").GameHistoryFilter} */
	const filterParam = /** @type {import("$lib/types").GameHistoryFilter} */ (
		url.searchParams.get("filter")
	);

	const sort =
		sortParam === "score" || sortParam === "moves" || sortParam === "date" ? sortParam : "date";
	const filter =
		filterParam === "won" ||
		filterParam === "lost" ||
		filterParam === "active" ||
		filterParam === "all"
			? filterParam
			: "all";

	const games = isPro && user ? getGameHistory(user.id, { sort, filter }) : [];

	return {
		user,
		isPro,
		games,
		sort,
		filter,
	};
}
