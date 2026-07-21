import { CHALLENGE_RUN_STATUS, CHALLENGE_TYPES } from "$lib/challenges.js";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

/**
 * Highest tile value on a board (empty / invalid boards → 0).
 * @param {unknown} board
 * @returns {number}
 */
export function highestTileFromBoard(board) {
	if (!Array.isArray(board)) return 0;
	let max = 0;
	for (const row of board) {
		if (!Array.isArray(row)) continue;
		for (const cell of row) {
			if (typeof cell === "number" && Number.isFinite(cell) && cell > max) {
				max = cell;
			}
		}
	}
	return max;
}

/**
 * Elapsed ms between two timestamps, or null if either is missing/invalid.
 * @param {Date | null | undefined} start
 * @param {Date | null | undefined} end
 * @returns {number | null}
 */
function durationMs(start, end) {
	if (!(start instanceof Date) || !(end instanceof Date)) return null;
	const ms = end.getTime() - start.getTime();
	return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

/**
 * Ranking value for a winning challenge run (lower is better).
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
 * Average 1-based daily-challenge leaderboard rank across challenges the user has won.
 * Uses each challenge's best win per player (same rules as the challenge leaderboard).
 *
 * @param {string} userId
 * @returns {{ averageRank: number | null; rankedClears: number }}
 */
function getAverageDailyChallengeRank(userId) {
	const userWins = db
		.select({
			challengeId: table.challengeRun.challengeId,
			score: table.challengeRun.score,
			metrics: table.challengeRun.metrics,
		})
		.from(table.challengeRun)
		.where(
			and(
				eq(table.challengeRun.userId, userId),
				eq(table.challengeRun.status, CHALLENGE_RUN_STATUS.WON)
			)
		)
		.all();

	if (userWins.length === 0) {
		return { averageRank: null, rankedClears: 0 };
	}

	const challengeIds = [...new Set(userWins.map((w) => w.challengeId))];

	const challengeRows = db
		.select({
			id: table.dailyChallenge.id,
			type: table.dailyChallenge.type,
		})
		.from(table.dailyChallenge)
		.where(inArray(table.dailyChallenge.id, challengeIds))
		.all();

	/** @type {Map<string, string>} */
	const typeById = new Map(challengeRows.map((row) => [row.id, row.type]));

	const allWins = db
		.select({
			challengeId: table.challengeRun.challengeId,
			userId: table.challengeRun.userId,
			score: table.challengeRun.score,
			metrics: table.challengeRun.metrics,
		})
		.from(table.challengeRun)
		.where(
			and(
				inArray(table.challengeRun.challengeId, challengeIds),
				eq(table.challengeRun.status, CHALLENGE_RUN_STATUS.WON)
			)
		)
		.all();

	/** @type {Map<string, Map<string, number>>} */
	const bestByChallenge = new Map();
	for (const win of allWins) {
		const challengeType = typeById.get(win.challengeId);
		if (!challengeType) continue;
		const value = rankingValueFromWin(win, challengeType);
		if (value == null) continue;

		let byUser = bestByChallenge.get(win.challengeId);
		if (!byUser) {
			byUser = new Map();
			bestByChallenge.set(win.challengeId, byUser);
		}
		const existing = byUser.get(win.userId);
		if (existing == null || value < existing) {
			byUser.set(win.userId, value);
		}
	}

	/** @type {number[]} */
	const ranks = [];
	for (const challengeId of challengeIds) {
		const byUser = bestByChallenge.get(challengeId);
		if (!byUser || !byUser.has(userId)) continue;

		const ranked = [...byUser.entries()].sort((a, b) => a[1] - b[1]);
		const index = ranked.findIndex(([id]) => id === userId);
		if (index >= 0) ranks.push(index + 1);
	}

	if (ranks.length === 0) {
		return { averageRank: null, rankedClears: 0 };
	}

	const sum = ranks.reduce((acc, rank) => acc + rank, 0);
	return {
		averageRank: Math.round((sum / ranks.length) * 10) / 10,
		rankedClears: ranks.length,
	};
}

/**
 * Longest and current win streaks over finished classic games (chronological).
 * @param {{ won: boolean; complete: boolean; completedOn: Date | null; updatedOn: Date }[]} games
 * @returns {{ longestWinStreak: number; currentWinStreak: number }}
 */
function winStreaksFromGames(games) {
	const finished = games
		.filter((g) => g.complete)
		.slice()
		.sort((a, b) => {
			const aTime = (a.completedOn ?? a.updatedOn)?.getTime?.() ?? 0;
			const bTime = (b.completedOn ?? b.updatedOn)?.getTime?.() ?? 0;
			return aTime - bTime;
		});

	let longest = 0;
	let current = 0;
	for (const game of finished) {
		if (game.won) {
			current += 1;
			if (current > longest) longest = current;
		} else {
			current = 0;
		}
	}

	return { longestWinStreak: longest, currentWinStreak: current };
}

/**
 * Aggregate personal play stats from classic games + daily challenge runs.
 *
 * @param {string} userId
 * @returns {{
 *   totalGames: number;
 *   completedGames: number;
 *   activeGames: number;
 *   wins: number;
 *   losses: number;
 *   winRate: number | null;
 *   bestScore: number | null;
 *   averageScore: number | null;
 *   highestTile: number;
 *   leastMovesToWin: number | null;
 *   fastestWinMs: number | null;
 *   totalMoves: number;
 *   averageMovesPerWin: number | null;
 *   longestWinStreak: number;
 *   currentWinStreak: number;
 *   challengeAttempts: number;
 *   challengeWins: number;
 *   challengeLosses: number;
 *   challengeWinRate: number | null;
 *   averageDailyChallengeRank: number | null;
 *   rankedChallengeClears: number;
 *   bestChallengeElapsedMs: number | null;
 *   bestChallengeMoveCount: number | null;
 * }}
 */
export function getUserPlayStats(userId) {
	const games = db
		.select({
			score: table.game.score,
			won: table.game.won,
			complete: table.game.complete,
			board: table.game.board,
			moveCount: table.game.moveCount,
			createdOn: table.game.createdOn,
			updatedOn: table.game.updatedOn,
			completedOn: table.game.completedOn,
		})
		.from(table.game)
		.where(eq(table.game.playerId, userId))
		.orderBy(asc(table.game.createdOn))
		.all();

	let wins = 0;
	let losses = 0;
	let activeGames = 0;
	let highestTile = 0;
	/** @type {number | null} */
	let bestScore = null;
	/** @type {number | null} */
	let leastMovesToWin = null;
	/** @type {number | null} */
	let fastestWinMs = null;
	let totalMoves = 0;
	let scoreSum = 0;
	let scoredCompleted = 0;
	let winMoveSum = 0;

	for (const game of games) {
		totalMoves += game.moveCount ?? 0;
		const tile = highestTileFromBoard(game.board);
		if (tile > highestTile) highestTile = tile;

		if (typeof game.score === "number" && Number.isFinite(game.score)) {
			if (bestScore == null || game.score > bestScore) bestScore = game.score;
		}

		if (!game.complete) {
			activeGames += 1;
			continue;
		}

		if (typeof game.score === "number" && Number.isFinite(game.score)) {
			scoreSum += game.score;
			scoredCompleted += 1;
		}

		if (game.won) {
			wins += 1;
			winMoveSum += game.moveCount ?? 0;
			if (
				typeof game.moveCount === "number" &&
				(leastMovesToWin == null || game.moveCount < leastMovesToWin)
			) {
				leastMovesToWin = game.moveCount;
			}
			const elapsed = durationMs(game.createdOn, game.completedOn ?? game.updatedOn);
			if (elapsed != null && (fastestWinMs == null || elapsed < fastestWinMs)) {
				fastestWinMs = elapsed;
			}
		} else {
			losses += 1;
		}
	}

	const completedGames = wins + losses;
	const decided = wins + losses;
	const { longestWinStreak, currentWinStreak } = winStreaksFromGames(games);

	const challengeRuns = db
		.select({
			status: table.challengeRun.status,
			score: table.challengeRun.score,
			metrics: table.challengeRun.metrics,
			challengeId: table.challengeRun.challengeId,
		})
		.from(table.challengeRun)
		.where(eq(table.challengeRun.userId, userId))
		.all();

	let challengeAttempts = 0;
	let challengeWins = 0;
	let challengeLosses = 0;
	/** @type {number | null} */
	let bestChallengeElapsedMs = null;
	/** @type {number | null} */
	let bestChallengeMoveCount = null;

	for (const run of challengeRuns) {
		if (run.status === CHALLENGE_RUN_STATUS.ABANDONED) continue;
		if (
			run.status === CHALLENGE_RUN_STATUS.IN_PROGRESS ||
			run.status === CHALLENGE_RUN_STATUS.WON ||
			run.status === CHALLENGE_RUN_STATUS.LOST
		) {
			challengeAttempts += 1;
		}
		if (run.status === CHALLENGE_RUN_STATUS.WON) {
			challengeWins += 1;
			if (run.metrics && typeof run.metrics === "object") {
				const metrics = /** @type {{ elapsedMs?: unknown; moveCount?: unknown }} */ (run.metrics);
				if (
					typeof metrics.elapsedMs === "number" &&
					Number.isFinite(metrics.elapsedMs) &&
					metrics.elapsedMs >= 0 &&
					(bestChallengeElapsedMs == null || metrics.elapsedMs < bestChallengeElapsedMs)
				) {
					bestChallengeElapsedMs = metrics.elapsedMs;
				}
				if (
					typeof metrics.moveCount === "number" &&
					Number.isFinite(metrics.moveCount) &&
					(bestChallengeMoveCount == null || metrics.moveCount < bestChallengeMoveCount)
				) {
					bestChallengeMoveCount = metrics.moveCount;
				}
			}
		} else if (run.status === CHALLENGE_RUN_STATUS.LOST) {
			challengeLosses += 1;
		}
	}

	const { averageRank, rankedClears } = getAverageDailyChallengeRank(userId);
	const challengeDecided = challengeWins + challengeLosses;

	return {
		totalGames: games.length,
		completedGames,
		activeGames,
		wins,
		losses,
		winRate: decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null,
		bestScore,
		averageScore: scoredCompleted > 0 ? Math.round(scoreSum / scoredCompleted) : null,
		highestTile,
		leastMovesToWin,
		fastestWinMs,
		totalMoves,
		averageMovesPerWin: wins > 0 ? Math.round(winMoveSum / wins) : null,
		longestWinStreak,
		currentWinStreak,
		challengeAttempts,
		challengeWins,
		challengeLosses,
		challengeWinRate:
			challengeDecided > 0 ? Math.round((challengeWins / challengeDecided) * 1000) / 10 : null,
		averageDailyChallengeRank: averageRank,
		rankedChallengeClears: rankedClears,
		bestChallengeElapsedMs,
		bestChallengeMoveCount,
	};
}
