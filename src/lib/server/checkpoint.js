import assert from "node:assert";
import { and, desc, eq } from "drizzle-orm";

import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getUser } from "$lib/server/user";

/**
 * Ensure the user is Pro and return their user row.
 * @param {string} userId
 */
function requireProUser(userId) {
	const user = getUser(userId);
	assert(user, "User not found");
	if (user.level !== USER_LEVELS.PRO) {
		const error = new Error("Checkpoints are a Pro feature");
		// @ts-ignore attach status for API handlers
		error.status = 403;
		// @ts-ignore
		error.code = "PRO_REQUIRED";
		throw error;
	}
	return user;
}

/**
 * Ensure the game exists and belongs to the user.
 * @param {string} gameId
 * @param {string} userId
 */
function requireOwnedGame(gameId, userId) {
	const existingGame = db.select().from(table.game).where(eq(table.game.id, gameId)).get();
	if (!existingGame || existingGame.playerId !== userId) {
		const error = new Error("Game not found");
		// @ts-ignore
		error.status = 404;
		throw error;
	}
	return existingGame;
}

/**
 * Map a checkpoint row to client-facing metadata.
 * @param {typeof table.gameCheckpoint.$inferSelect} row
 * @returns {import("$lib/types").CheckpointInfo}
 */
function toCheckpointInfo(row) {
	return {
		id: row.id,
		gameId: row.gameId,
		createdOn: row.createdOn.getTime(),
		score: row.score,
		moveCount: row.moveCount,
	};
}

/**
 * Get the active (restorable) checkpoint for a game owned by the user.
 * @param {string} userId
 * @param {string} gameId
 * @returns {import("$lib/types").CheckpointInfo | null}
 */
export function getActiveCheckpoint(userId, gameId) {
	const row = db
		.select()
		.from(table.gameCheckpoint)
		.where(
			and(
				eq(table.gameCheckpoint.playerId, userId),
				eq(table.gameCheckpoint.gameId, gameId),
				eq(table.gameCheckpoint.isActive, true)
			)
		)
		.orderBy(desc(table.gameCheckpoint.createdOn))
		.get();

	return row ? toCheckpointInfo(row) : null;
}

/**
 * Set a checkpoint for the current game. Marks any prior active checkpoint as inactive.
 *
 * @param {string} userId
 * @param {import("$lib/types").CheckpointSaveData} snapshot
 * @returns {Promise<import("$lib/types").CheckpointInfo>}
 */
export async function setCheckpoint(userId, snapshot) {
	requireProUser(userId);
	assert(snapshot?.gameId, "gameId is required");
	assert(Array.isArray(snapshot.board), "board is required");
	assert(typeof snapshot.score === "number", "score is required");

	const existingGame = requireOwnedGame(snapshot.gameId, userId);

	await db
		.update(table.gameCheckpoint)
		.set({ isActive: false })
		.where(
			and(
				eq(table.gameCheckpoint.playerId, userId),
				eq(table.gameCheckpoint.gameId, snapshot.gameId),
				eq(table.gameCheckpoint.isActive, true)
			)
		);

	/** @type {number[] | null} */
	let moves = null;
	if (snapshot.moves === null) {
		moves = null;
	} else if (Array.isArray(snapshot.moves)) {
		moves = snapshot.moves;
	} else {
		// Older clients omit moves — fall back to the game row when lengths match.
		const existingMoves = existingGame.moves;
		if (
			Array.isArray(existingMoves) &&
			existingMoves.length === (snapshot.moveCount ?? existingGame.moveCount)
		) {
			moves = existingMoves;
		}
	}

	const createdOn = new Date();
	const inserted = db
		.insert(table.gameCheckpoint)
		.values({
			id: crypto.randomUUID(),
			playerId: userId,
			gameId: snapshot.gameId,
			createdOn,
			isActive: true,
			board: snapshot.board,
			score: snapshot.score,
			seed: snapshot.seed ?? null,
			rngState: snapshot.rngState ?? null,
			moveCount: snapshot.moveCount ?? 0,
			undoCooldownRemaining: snapshot.undoCooldownRemaining ?? 0,
			won: snapshot.won ?? false,
			moves,
		})
		.returning()
		.get();

	return toCheckpointInfo(inserted);
}

/**
 * Restore the active checkpoint into the current game row and return the restored state.
 *
 * @param {string} userId
 * @param {string} gameId
 * @returns {Promise<import("$lib/types").CheckpointRestoreState>}
 */
export async function restoreCheckpoint(userId, gameId) {
	requireProUser(userId);
	assert(gameId, "gameId is required");

	requireOwnedGame(gameId, userId);

	const checkpoint = db
		.select()
		.from(table.gameCheckpoint)
		.where(
			and(
				eq(table.gameCheckpoint.playerId, userId),
				eq(table.gameCheckpoint.gameId, gameId),
				eq(table.gameCheckpoint.isActive, true)
			)
		)
		.orderBy(desc(table.gameCheckpoint.createdOn))
		.get();

	if (!checkpoint) {
		const error = new Error("No checkpoint found");
		// @ts-ignore
		error.status = 404;
		// @ts-ignore
		error.code = "NO_CHECKPOINT";
		throw error;
	}

	// Restore into the same game (not a new slot). Always reopen as incomplete so play can continue.
	// Prefer stored moves so the run stays replayable; legacy checkpoints may still be null.
	const moves = Array.isArray(checkpoint.moves) ? checkpoint.moves : null;

	await db
		.update(table.game)
		.set({
			board: checkpoint.board,
			score: checkpoint.score,
			won: checkpoint.won,
			complete: false,
			seed: checkpoint.seed,
			rngState: checkpoint.rngState,
			moveCount: checkpoint.moveCount,
			undoCooldownRemaining: checkpoint.undoCooldownRemaining,
			moves,
			updatedOn: new Date(),
		})
		.where(eq(table.game.id, gameId));

	return {
		id: gameId,
		board: checkpoint.board,
		score: checkpoint.score,
		seed: checkpoint.seed ?? undefined,
		rngState: checkpoint.rngState ?? undefined,
		moveCount: checkpoint.moveCount,
		undoCooldownRemaining: checkpoint.undoCooldownRemaining,
		won: checkpoint.won,
		complete: false,
		moves,
	};
}
