import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import {
	CHALLENGE_RUN_STATUS,
	dailyChallengeId,
	dateFromChallengeId,
	generateDailyChallengeDefinition,
	getChallengeDateString,
	parseChallengeDate,
} from "$lib/challenges.js";

/**
 * @param {typeof table.dailyChallenge.$inferSelect} row
 * @returns {import("$lib/challenges.js").ChallengeDefinition}
 */
function rowToChallenge(row) {
	return {
		id: row.id,
		type: /** @type {import("$lib/challenges.js").ChallengeDefinition["type"]} */ (row.type),
		title: row.title,
		description: row.description,
		difficulty: row.difficulty,
		params: /** @type {import("$lib/challenges.js").ChallengeDefinition["params"]} */ (row.params),
	};
}

/**
 * Ensure a daily challenge exists for the given YYYY-MM-DD (CST civil date).
 * Creates it deterministically if missing — safe to call on every request.
 * @param {string} [dateStr]
 * @returns {import("$lib/challenges.js").ChallengeDefinition}
 */
export function ensureDailyChallenge(dateStr = getChallengeDateString()) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) {
		throw new Error(`Invalid challenge date: ${dateStr}`);
	}

	const id = dailyChallengeId(dateStr);
	const existing = db
		.select()
		.from(table.dailyChallenge)
		.where(eq(table.dailyChallenge.id, id))
		.get();

	// Legacy clear-board challenges are removed; regenerate that day as time/recovery.
	if (existing && existing.type === "clear") {
		db.delete(table.challengeRun).where(eq(table.challengeRun.challengeId, id)).run();
		db.delete(table.dailyChallenge).where(eq(table.dailyChallenge.id, id)).run();
	} else if (existing) {
		return rowToChallenge(existing);
	}

	const definition = generateDailyChallengeDefinition(dateStr);
	const now = new Date();

	try {
		db.insert(table.dailyChallenge)
			.values({
				id: definition.id,
				challengeDate: dateStr,
				type: definition.type,
				title: definition.title,
				description: definition.description,
				difficulty: definition.difficulty,
				params: definition.params,
				createdOn: now,
			})
			.run();
	} catch {
		// Race: another request inserted first
		const raced = db
			.select()
			.from(table.dailyChallenge)
			.where(eq(table.dailyChallenge.id, id))
			.get();
		if (raced) return rowToChallenge(raced);
		throw new Error(`Failed to create daily challenge for ${dateStr}`);
	}

	return definition;
}

/**
 * Load a challenge by id (daily-YYYY-MM-DD or legacy lookup via date).
 * Ensures the row exists when the date is today or in the past (CST).
 * @param {string} id
 * @returns {import("$lib/challenges.js").ChallengeDefinition | null}
 */
export function getChallengeById(id) {
	const dateStr = dateFromChallengeId(id);
	if (!dateStr) return null;

	const today = getChallengeDateString();
	if (dateStr > today) return null;

	return ensureDailyChallenge(dateStr);
}

/**
 * @param {unknown} metrics
 * @returns {number | null}
 */
function moveCountFromMetrics(metrics) {
	if (!metrics || typeof metrics !== "object") return null;
	const value = /** @type {{ moveCount?: unknown }} */ (metrics).moveCount;
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * @param {string} userId
 * @param {string[]} challengeIds
 * @returns {Record<string, { bestStatus: string | null; attempts: number; wins: number; bestMoveCount: number | null; bestScore: number | null }>}
 */
export function getChallengeStatsForUser(userId, challengeIds = []) {
	const runs = db
		.select({
			challengeId: table.challengeRun.challengeId,
			status: table.challengeRun.status,
			score: table.challengeRun.score,
			metrics: table.challengeRun.metrics,
		})
		.from(table.challengeRun)
		.where(eq(table.challengeRun.userId, userId))
		.all();

	/** @type {Record<string, { bestStatus: string | null; attempts: number; wins: number; bestMoveCount: number | null; bestScore: number | null }>} */
	const stats = {};

	for (const challengeId of challengeIds) {
		stats[challengeId] = {
			bestStatus: null,
			attempts: 0,
			wins: 0,
			bestMoveCount: null,
			bestScore: null,
		};
	}

	for (const run of runs) {
		if (!stats[run.challengeId]) {
			stats[run.challengeId] = {
				bestStatus: null,
				attempts: 0,
				wins: 0,
				bestMoveCount: null,
				bestScore: null,
			};
		}
		const entry = stats[run.challengeId];
		if (run.status !== CHALLENGE_RUN_STATUS.ABANDONED) {
			entry.attempts += 1;
		}
		if (run.status === CHALLENGE_RUN_STATUS.WON) {
			entry.wins += 1;
			entry.bestStatus = CHALLENGE_RUN_STATUS.WON;
			const moves = moveCountFromMetrics(run.metrics);
			if (moves != null && (entry.bestMoveCount == null || moves < entry.bestMoveCount)) {
				entry.bestMoveCount = moves;
			}
			if (
				typeof run.score === "number" &&
				(entry.bestScore == null || run.score > entry.bestScore)
			) {
				entry.bestScore = run.score;
			}
		} else if (
			run.status === CHALLENGE_RUN_STATUS.LOST &&
			entry.bestStatus !== CHALLENGE_RUN_STATUS.WON
		) {
			entry.bestStatus = CHALLENGE_RUN_STATUS.LOST;
		}
	}

	return stats;
}

/**
 * Calendar day statuses for a user within a YYYY-MM range (inclusive days).
 * @param {string} userId
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 */
export function getChallengeDayStatuses(userId, startDate, endDate) {
	const startId = dailyChallengeId(startDate);
	const endId = dailyChallengeId(endDate);

	const runs = db
		.select({
			challengeId: table.challengeRun.challengeId,
			status: table.challengeRun.status,
		})
		.from(table.challengeRun)
		.where(
			and(
				eq(table.challengeRun.userId, userId),
				gte(table.challengeRun.challengeId, startId),
				lte(table.challengeRun.challengeId, endId)
			)
		)
		.all();

	/** @type {Record<string, string>} */
	const byDate = {};

	for (const run of runs) {
		const dateStr = dateFromChallengeId(run.challengeId);
		if (!dateStr) continue;
		const prev = byDate[dateStr];
		if (run.status === CHALLENGE_RUN_STATUS.WON) {
			byDate[dateStr] = CHALLENGE_RUN_STATUS.WON;
		} else if (run.status === CHALLENGE_RUN_STATUS.LOST && prev !== CHALLENGE_RUN_STATUS.WON) {
			byDate[dateStr] = CHALLENGE_RUN_STATUS.LOST;
		} else if (run.status === CHALLENGE_RUN_STATUS.IN_PROGRESS && !prev) {
			byDate[dateStr] = CHALLENGE_RUN_STATUS.IN_PROGRESS;
		}
	}

	return byDate;
}

/**
 * Mark in-progress runs for a challenge as abandoned before starting a new one.
 * @param {string} userId
 * @param {string} challengeId
 */
export async function abandonInProgressRuns(userId, challengeId) {
	await db
		.update(table.challengeRun)
		.set({
			status: CHALLENGE_RUN_STATUS.ABANDONED,
			finishedOn: new Date(),
			updatedOn: new Date(),
		})
		.where(
			and(
				eq(table.challengeRun.userId, userId),
				eq(table.challengeRun.challengeId, challengeId),
				eq(table.challengeRun.status, CHALLENGE_RUN_STATUS.IN_PROGRESS)
			)
		);
}

/**
 * Start a new challenge run for a user.
 * @param {string} userId
 * @param {string} challengeId
 * @returns {Promise<{ id: string }>}
 */
export async function startChallengeRun(userId, challengeId) {
	const challenge = getChallengeById(challengeId);
	if (!challenge) {
		throw new Error(`Unknown challenge: ${challengeId}`);
	}

	await abandonInProgressRuns(userId, challengeId);

	const id = crypto.randomUUID();
	const now = new Date();

	await db.insert(table.challengeRun).values({
		id,
		challengeId,
		userId,
		status: CHALLENGE_RUN_STATUS.IN_PROGRESS,
		score: 0,
		metrics: {},
		startedOn: now,
		updatedOn: now,
	});

	return { id };
}

/**
 * @param {string} runId
 * @param {string} userId
 */
export function getChallengeRun(runId, userId) {
	const run = db
		.select()
		.from(table.challengeRun)
		.where(and(eq(table.challengeRun.id, runId), eq(table.challengeRun.userId, userId)))
		.get();

	return run ?? null;
}

/**
 * Complete a challenge run with won/lost status.
 *
 * @param {string} runId
 * @param {string} userId
 * @param {{
 *   status: typeof CHALLENGE_RUN_STATUS.WON | typeof CHALLENGE_RUN_STATUS.LOST;
 *   score: number;
 *   metrics?: Record<string, unknown>;
 * }} result
 */
export async function completeChallengeRun(runId, userId, result) {
	const run = getChallengeRun(runId, userId);
	if (!run) {
		throw new Error("Challenge run not found");
	}
	if (run.status !== CHALLENGE_RUN_STATUS.IN_PROGRESS) {
		return run;
	}

	if (result.status !== CHALLENGE_RUN_STATUS.WON && result.status !== CHALLENGE_RUN_STATUS.LOST) {
		throw new Error("Invalid completion status");
	}

	const now = new Date();
	await db
		.update(table.challengeRun)
		.set({
			status: result.status,
			score: result.score,
			metrics: result.metrics ?? {},
			finishedOn: now,
			updatedOn: now,
		})
		.where(eq(table.challengeRun.id, runId));

	return getChallengeRun(runId, userId);
}

/**
 * Recent finished runs for a user (optional UI).
 * @param {string} userId
 * @param {number} [limit]
 */
export function getRecentChallengeRuns(userId, limit = 10) {
	return db
		.select()
		.from(table.challengeRun)
		.where(
			and(
				eq(table.challengeRun.userId, userId),
				inArray(table.challengeRun.status, [CHALLENGE_RUN_STATUS.WON, CHALLENGE_RUN_STATUS.LOST])
			)
		)
		.orderBy(desc(table.challengeRun.finishedOn))
		.limit(limit)
		.all();
}
