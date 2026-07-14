import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { CHALLENGE_RUN_STATUS, CHALLENGES, getChallengeById } from "$lib/challenges.js";

/**
 * @param {string} userId
 * @returns {Record<string, { bestStatus: string | null; attempts: number; wins: number }>}
 */
export function getChallengeStatsForUser(userId) {
	const runs = db
		.select({
			challengeId: table.challengeRun.challengeId,
			status: table.challengeRun.status,
		})
		.from(table.challengeRun)
		.where(eq(table.challengeRun.userId, userId))
		.all();

	/** @type {Record<string, { bestStatus: string | null; attempts: number; wins: number }>} */
	const stats = {};

	for (const challenge of CHALLENGES) {
		stats[challenge.id] = { bestStatus: null, attempts: 0, wins: 0 };
	}

	for (const run of runs) {
		if (!stats[run.challengeId]) {
			stats[run.challengeId] = { bestStatus: null, attempts: 0, wins: 0 };
		}
		const entry = stats[run.challengeId];
		if (run.status !== CHALLENGE_RUN_STATUS.ABANDONED) {
			entry.attempts += 1;
		}
		if (run.status === CHALLENGE_RUN_STATUS.WON) {
			entry.wins += 1;
			entry.bestStatus = CHALLENGE_RUN_STATUS.WON;
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
