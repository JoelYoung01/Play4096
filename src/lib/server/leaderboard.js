import { eq, and, gte, lt, sql } from "drizzle-orm";
import { CHALLENGE_RUN_STATUS, CHALLENGE_TYPES } from "$lib/challenges.js";
import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

/**
 * Score attribution instant for a finished classic game.
 * Prefer completedOn; fall back to updatedOn for older/abandoned rows.
 */
const gameScoreAt = sql`coalesce(${table.game.completedOn}, ${table.game.updatedOn})`;

/**
 * Best completed classic score per Pro user.
 * Optional half-open time window [start, end). Omit both for all-time.
 *
 * Source of truth: completed `game` rows (not denormalized profile best_score).
 *
 * @param {Date} [start]
 * @param {Date} [end]
 * @returns {{ id: string; username: string; displayName: string | null; bestScore: number }[]}
 */
function getClassicBestByUser(start, end) {
	/** @type {import("drizzle-orm").SQL[]} */
	const conditions = [
		eq(table.user.level, USER_LEVELS.PRO),
		eq(table.game.complete, true),
		sql`${table.game.score} is not null`,
	];

	if (start != null && end != null) {
		conditions.push(gte(gameScoreAt, start.getTime()), lt(gameScoreAt, end.getTime()));
	}

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
		.where(and(...conditions))
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
 * All-time classic leaderboard from completed games (max score per Pro user).
 * @param {number} [limit]
 */
export function getAllTimeLeaderboard(limit = 10) {
	return getClassicBestByUser().slice(0, limit);
}

/**
 * 1-based rank of a user on the all-time classic leaderboard, or null if no completed score.
 * @param {string} userId
 * @returns {{ rank: number; bestScore: number } | null}
 */
export function getAllTimeUserRank(userId) {
	const ranked = getClassicBestByUser();
	const index = ranked.findIndex((entry) => entry.id === userId);
	if (index < 0) return null;
	return { rank: index + 1, bestScore: ranked[index].bestScore };
}

/**
 * Classic high-score leaderboard for a time window.
 * @param {Date} start
 * @param {Date} end
 * @param {number} [limit]
 */
export function getClassicPeriodLeaderboard(start, end, limit = 10) {
	return getClassicBestByUser(start, end).slice(0, limit);
}

/**
 * 1-based rank of a user on a classic period leaderboard, or null if no score in range.
 * @param {string} userId
 * @param {Date} start
 * @param {Date} end
 * @returns {{ rank: number; bestScore: number } | null}
 */
export function getClassicPeriodUserRank(userId, start, end) {
	const ranked = getClassicBestByUser(start, end);
	const index = ranked.findIndex((entry) => entry.id === userId);
	if (index < 0) return null;
	return { rank: index + 1, bestScore: ranked[index].bestScore };
}

/**
 * Ranking value for a winning challenge run.
 * Time challenges rank by elapsed ms (prefer metrics.elapsedMs; score stores ms on new clears).
 * Recovery challenges rank by move count stored in score.
 *
 * @param {{ score: number | null; metrics: unknown }} win
 * @param {string} challengeType
 * @returns {number | null}
 */
function rankingValueFromWin(win, challengeType) {
	if (challengeType === CHALLENGE_TYPES.TIME) {
		if (win.metrics && typeof win.metrics === "object") {
			const elapsed = /** @type {{ elapsedMs?: unknown }} */ (win.metrics).elapsedMs;
			if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed >= 0) {
				return elapsed;
			}
		}
		if (typeof win.score === "number" && Number.isFinite(win.score) && win.score >= 0) {
			return win.score;
		}
		return null;
	}

	if (typeof win.score !== "number" || !Number.isFinite(win.score)) return null;
	return win.score;
}

/**
 * Best winning run per user for a daily challenge, ordered for the leaderboard.
 * Both time (elapsed ms) and recovery (move count) rank lower-is-better.
 * `bestScore` is the ranking metric value (ms or moves).
 *
 * @param {string} challengeId
 * @param {string} challengeType
 * @returns {{ id: string; username: string; displayName: string | null; bestScore: number }[]}
 */
function getBestWinsByUser(challengeId, challengeType) {
	const wins = db
		.select({
			userId: table.challengeRun.userId,
			score: table.challengeRun.score,
			metrics: table.challengeRun.metrics,
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

	/** @type {Map<string, { id: string; username: string; displayName: string | null; bestScore: number }>} */
	const bestByUser = new Map();

	for (const win of wins) {
		const value = rankingValueFromWin(win, challengeType);
		if (value == null) continue;
		const existing = bestByUser.get(win.userId);
		const isBetter = !existing || value < existing.bestScore;
		if (isBetter) {
			bestByUser.set(win.userId, {
				id: win.userId,
				username: win.username,
				displayName: win.displayName ?? null,
				bestScore: value,
			});
		}
	}

	const ranked = [...bestByUser.values()];
	ranked.sort((a, b) => a.bestScore - b.bestScore);
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
