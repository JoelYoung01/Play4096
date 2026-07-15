import { fail, redirect } from "@sveltejs/kit";
import { USER_LEVELS } from "$lib/constants.js";
import {
	dateFromChallengeId,
	formatChallengeOverview,
	getChallengeDateString,
} from "$lib/challenges.js";
import {
	getChallengeById,
	getChallengeStatsForUser,
	startChallengeRun,
} from "$lib/server/challenge.js";
import {
	getDailyChallengeLeaderboard,
	getDailyChallengeUserRank,
} from "$lib/server/leaderboard.js";
import { getUserProfile, requireLogin } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals, params }) {
	const challenge = getChallengeById(params.id);
	if (!challenge) {
		redirect(302, "/challenges");
	}

	const dateStr = dateFromChallengeId(challenge.id);
	const today = getChallengeDateString();
	const isToday = dateStr === today;
	const isPast = dateStr != null && dateStr < today;

	let user = null;
	let stats = null;
	if (locals.user) {
		user = getUserProfile(locals.user.id);
		if (user?.level === USER_LEVELS.PRO) {
			stats = getChallengeStatsForUser(user.id, [challenge.id])?.[challenge.id] ?? null;
		}
	}

	const isPro = user?.level === USER_LEVELS.PRO;

	// Past days are a Pro archive — free users get the same lock pattern as history.
	if (isPast && !isPro) {
		return {
			user,
			isPro: false,
			locked: true,
			isToday: false,
			challenge: {
				id: challenge.id,
				title: challenge.title,
				type: challenge.type,
				difficulty: challenge.difficulty,
				description: "Upgrade to Pro to play past daily challenges.",
				params: {},
			},
			overview: "Upgrade to Pro to open past daily challenges.",
			dateStr,
			stats: null,
			leaderboard: [],
			userRank: null,
			userBestScore: null,
		};
	}

	const leaderboard = getDailyChallengeLeaderboard(challenge.id, challenge.type, 10);
	let userRank = null;
	/** @type {number | null} */
	let userBestScore = null;
	if (user) {
		const rankInfo = getDailyChallengeUserRank(user.id, challenge.id, challenge.type);
		if (rankInfo) {
			userRank = rankInfo.rank;
			userBestScore = rankInfo.bestScore;
		}
	}

	return {
		user,
		isPro,
		locked: false,
		isToday,
		challenge,
		overview: formatChallengeOverview(challenge),
		dateStr,
		stats,
		leaderboard,
		userRank,
		userBestScore,
	};
}

/** @type {import("./$types").Actions} */
export const actions = {
	start: async ({ params }) => {
		const user = requireLogin(`/challenges/${params.id}`);

		if (user.level !== USER_LEVELS.PRO) {
			redirect(303, "/stripe");
		}

		const challenge = getChallengeById(params.id);
		if (!challenge) {
			return fail(404, { error: "Challenge not found" });
		}

		const dateStr = dateFromChallengeId(challenge.id);
		const today = getChallengeDateString();
		if (dateStr && dateStr > today) {
			return fail(400, { error: "Challenge not available yet" });
		}

		const run = await startChallengeRun(user.id, challenge.id);
		redirect(303, `/challenges/${challenge.id}/play?run=${run.id}`);
	},
};
