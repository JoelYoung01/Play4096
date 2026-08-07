import {
	getClassicPeriodLeaderboard,
	getClassicPeriodUserRank,
} from "$lib/server/leaderboard";
import {
	LEADERBOARD_PERIODS,
	formatPeriodRangeLabel,
	getClassicPeriodWindow,
} from "$lib/leaderboardPeriods.js";
import { getChallengeDateString, parseChallengeDate } from "$lib/challenges.js";
import { err, ok } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals, url }) {
	const period = url.searchParams.get("period") || LEADERBOARD_PERIODS.DAILY;
	if (!Object.values(LEADERBOARD_PERIODS).includes(/** @type {any} */ (period))) {
		return err("Invalid period");
	}

	const today = getChallengeDateString();
	const requested = url.searchParams.get("date");
	if (requested && (!parseChallengeDate(requested) || requested > today)) {
		return err("Invalid date");
	}

	const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100);
	const window = getClassicPeriodWindow(/** @type {any} */ (period), requested ?? undefined);
	const entries = getClassicPeriodLeaderboard(window.start, window.end, limit);

	let userRank = null;
	let userBestScore = null;
	if (locals.user) {
		const rank = getClassicPeriodUserRank(locals.user.id, window.start, window.end);
		userRank = rank?.rank ?? null;
		userBestScore = rank?.bestScore ?? null;
	}

	return ok({
		entries,
		userRank,
		userBestScore,
		period,
		anchorDate: window.anchorDate,
		prevDate: window.prevAnchor,
		nextDate: window.nextAnchor,
		rangeLabel: formatPeriodRangeLabel(window),
		isCurrent: window.isCurrent,
	});
}
