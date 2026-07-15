import { eq, desc, count, and, gt, gte, lt, sql } from "drizzle-orm";
import { CHALLENGE_RUN_STATUS, CHALLENGE_TYPES } from "$lib/challenges.js";
import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export async function getAllTimeLeaderboard() {
	const leaderboard = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			displayName: table.userProfile.displayName,
			bestScore: table.userProfile.bestScore,
		})
		.from(table.user)
		.innerJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(eq(table.user.level, USER_LEVELS.PRO))
		.orderBy(desc(table.userProfile.bestScore))
		.limit(10);

	return leaderboard;
}

/**
 * Get the rank of a user in the all time leaderboard
 * @param {string} userId
 */
export async function getAllTimeUserRank(userId) {
	const userResult = db
		.select({
			bestScore: table.userProfile.bestScore,
		})
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, userId))
		.get();

	const bestScore = userResult?.bestScore ?? 0;

	const [{ count: betterUsersCount }] = await db
		.select({
			count: count(),
		})
		.from(table.user)
		.innerJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(and(eq(table.user.level, USER_LEVELS.PRO), gt(table.userProfile.bestScore, bestScore)));

	return betterUsersCount + 1;
}

/**
 * Score attribution instant for a finished classic game.
 * Prefer completedOn; fall back to updatedOn for older/abandoned rows.
 */
const gameScoreAt = sql`coalesce(${table.game.completedOn}, ${table.game.updatedOn})`;

/**
 * Best classic score per Pro user within a half-open time window [start, end).
 * Source: completed `game` rows (not all-time profile best).
 *
 * @param {Date} start
 * @param {Date} end
 * @returns {{ id: string; username: string; displayName: string | null; bestScore: number }[]}
 */
function getClassicBestByUserInRange(start, end) {
	const startMs = start.getTime();
	const endMs = end.getTime();

	const rows = db
		.select({
			id: table.user.id,
			username: table.user.username,
			displayName: table.userProfile.displayName,
			score: table.game.score,
		})
		.from(table.game)
		.innerJoin(table.user, eq(table.game.playerId, table.user.id))
		.leftJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(
			and(
				eq(table.user.level, USER_LEVELS.PRO),
				eq(table.game.complete, true),
				sql`${table.game.score} is not null`,
				gte(gameScoreAt, startMs),
				lt(gameScoreAt, endMs)
			)
		)
		.all();

	/** @type {Map<string, { id: string; username: string; displayName: string | null; bestScore: number }>} */
	const bestByUser = new Map();
	for (const row of rows) {
		if (typeof row.score !== "number" || !Number.isFinite(row.score)) continue;
		const existing = bestByUser.get(row.id);
		if (!existing || row.score > existing.bestScore) {
			bestByUser.set(row.id, {
				id: row.id,
				username: row.username,
				displayName: row.displayName ?? null,
				bestScore: row.score,
			});
		}
	}

	const ranked = [...bestByUser.values()];
	ranked.sort((a, b) => b.bestScore - a.bestScore);
	return ranked;
}

/**
 * Classic high-score leaderboard for a time window.
 * @param {Date} start
 * @param {Date} end
 * @param {number} [limit]
 */
export function getClassicPeriodLeaderboard(start, end, limit = 10) {
	return getClassicBestByUserInRange(start, end).slice(0, limit);
}

/**
 * 1-based rank of a user on a classic period leaderboard, or null if no score in range.
 * @param {string} userId
 * @param {Date} start
 * @param {Date} end
 * @returns {{ rank: number; bestScore: number } | null}
 */
export function getClassicPeriodUserRank(userId, start, end) {
	const ranked = getClassicBestByUserInRange(start, end);
	const index = ranked.findIndex((entry) => entry.id === userId);
	if (index < 0) return null;
	return { rank: index + 1, bestScore: ranked[index].bestScore };
}

/**
 * Whether lower scores rank better for this challenge type.
 * Time challenges store points (higher better); recovery stores move count (lower better).
 * @param {string} challengeType
 */
function isLowerBetter(challengeType) {
	return challengeType === CHALLENGE_TYPES.RECOVERY;
}

/**
 * Best winning score per user for a daily challenge, ordered for the leaderboard.
 * @param {string} challengeId
 * @param {string} challengeType
 * @returns {{ id: string; username: string; displayName: string | null; bestScore: number }[]}
 */
function getBestWinsByUser(challengeId, challengeType) {
	const wins = db
		.select({
			userId: table.challengeRun.userId,
			score: table.challengeRun.score,
			username: table.user.username,
			displayName: table.userProfile.displayName,
		})
		.from(table.challengeRun)
		.innerJoin(table.user, eq(table.challengeRun.userId, table.user.id))
		.leftJoin(table.userProfile, eq(table.user.id, table.userProfile.userId))
		.where(
			and(
				eq(table.challengeRun.challengeId, challengeId),
				eq(table.challengeRun.status, CHALLENGE_RUN_STATUS.WON)
			)
		)
		.all();

	const lowerBetter = isLowerBetter(challengeType);
	/** @type {Map<string, { id: string; username: string; displayName: string | null; bestScore: number }>} */
	const bestByUser = new Map();

	for (const win of wins) {
		if (typeof win.score !== "number" || !Number.isFinite(win.score)) continue;
		const existing = bestByUser.get(win.userId);
		const isBetter =
			!existing || (lowerBetter ? win.score < existing.bestScore : win.score > existing.bestScore);
		if (isBetter) {
			bestByUser.set(win.userId, {
				id: win.userId,
				username: win.username,
				displayName: win.displayName ?? null,
				bestScore: win.score,
			});
		}
	}

	const ranked = [...bestByUser.values()];
	ranked.sort((a, b) => (lowerBetter ? a.bestScore - b.bestScore : b.bestScore - a.bestScore));
	return ranked;
}

/**
 * Global leaderboard for a single daily challenge (best win per user).
 * @param {string} challengeId
 * @param {string} challengeType
 * @param {number} [limit]
 */
export function getDailyChallengeLeaderboard(challengeId, challengeType, limit = 10) {
	return getBestWinsByUser(challengeId, challengeType).slice(0, limit);
}

/**
 * 1-based rank of a user on a daily challenge leaderboard, or null if they have no win.
 * @param {string} userId
 * @param {string} challengeId
 * @param {string} challengeType
 * @returns {{ rank: number; bestScore: number; total: number } | null}
 */
export function getDailyChallengeUserRank(userId, challengeId, challengeType) {
	const ranked = getBestWinsByUser(challengeId, challengeType);
	const index = ranked.findIndex((entry) => entry.id === userId);
	if (index < 0) return null;
	return { rank: index + 1, bestScore: ranked[index].bestScore, total: ranked.length };
}

/**
 * How many players have a winning clear on this challenge.
 * @param {string} challengeId
 * @param {string} challengeType
 */
export function getDailyChallengeEntryCount(challengeId, challengeType) {
	return getBestWinsByUser(challengeId, challengeType).length;
}
