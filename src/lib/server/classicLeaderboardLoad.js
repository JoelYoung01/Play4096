import {
	formatPeriodRangeLabel,
	getClassicPeriodWindow,
	LEADERBOARD_PERIODS,
} from "$lib/leaderboardPeriods.js";
import { getChallengeDateString, parseChallengeDate } from "$lib/challenges.js";
import { getClassicPeriodLeaderboard, getClassicPeriodUserRank } from "$lib/server/leaderboard.js";
import { getUserProfile } from "$lib/server/user";
import { redirect } from "@sveltejs/kit";

/**
 * Shared load for classic daily / weekly / monthly score leaderboards.
 * @param {import("@sveltejs/kit").RequestEvent} event
 * @param {import("$lib/leaderboardPeriods.js").LeaderboardPeriod} period
 */
export async function loadClassicPeriodLeaderboard(event, period) {
	const { locals, url } = event;
	const today = getChallengeDateString();
	const requested = url.searchParams.get("date");

	if (requested) {
		if (!parseChallengeDate(requested) || requested > today) {
			redirect(302, `/leaderboard/${period}`);
		}
	}

	const window = getClassicPeriodWindow(period, requested ?? undefined);

	let user = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
	}

	const leaderboard = getClassicPeriodLeaderboard(window.start, window.end);
	let userRank = null;
	/** @type {number | null} */
	let userBestScore = null;

	if (user) {
		const rankInfo = getClassicPeriodUserRank(user.id, window.start, window.end);
		if (rankInfo) {
			userRank = rankInfo.rank;
			userBestScore = rankInfo.bestScore;
		}
	}

	const periodTitles = {
		[LEADERBOARD_PERIODS.DAILY]: "Daily",
		[LEADERBOARD_PERIODS.WEEKLY]: "Weekly",
		[LEADERBOARD_PERIODS.MONTHLY]: "Monthly",
	};

	return {
		user,
		userRank,
		userBestScore,
		leaderboard,
		period,
		periodTitle: periodTitles[period],
		rangeLabel: formatPeriodRangeLabel(window),
		anchorDate: window.anchorDate,
		prevDate: window.prevAnchor,
		nextDate: window.nextAnchor,
		isCurrent: window.isCurrent,
	};
}
