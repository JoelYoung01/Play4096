import { getChallengeDateString } from "$lib/challenges.js";
import { shiftCivilDate } from "$lib/leaderboardPeriods.js";
import {
	ensureDailyChallenge,
	getChallengeDayStatuses,
} from "$lib/server/challenge";
import { getUser } from "$lib/server/user";
import { USER_LEVELS } from "$lib/constants";
import { ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, url }) {
	const today = getChallengeDateString();
	const month = url.searchParams.get("month") || today.slice(0, 7); // YYYY-MM
	const startDate = `${month}-01`;
	const nextMonth = shiftCivilDate(`${month}-28`, 10);
	const endDate = nextMonth ? `${nextMonth.slice(0, 7)}-01` : today;

	const todayChallenge = ensureDailyChallenge(today);
	const user = locals.user ? getUser(locals.user.id) : null;
	const isPro = user?.level === USER_LEVELS.PRO;

	/** @type {Record<string, string> | null} */
	let dayStatuses = null;
	if (locals.user && isPro) {
		dayStatuses = getChallengeDayStatuses(locals.user.id, startDate, endDate);
	}

	return ok({
		today,
		todayChallenge,
		isPro,
		month,
		dayStatuses,
		canPlayPast: Boolean(isPro),
	});
}
