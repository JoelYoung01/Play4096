import * as table from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { and, desc, eq, ne, not, sql } from "drizzle-orm";
import assert from "node:assert";

/**
 * SQL predicate matching {@link gameHasReplay}: seed + non-empty moves whose
 * length equals move_count. Use for leaderboard / best-score queries so
 * unverifiable (cheat / checkpoint / legacy) scores cannot rank.
 *
 * @type {import("drizzle-orm").SQL}
 */
export const gameHasReplaySql = /** @type {import("drizzle-orm").SQL} */ (
	and(
		sql`${table.game.seed} is not null`,
		sql`${table.game.moves} is not null`,
		sql`json_array_length(${table.game.moves}) > 0`,
		sql`json_array_length(${table.game.moves}) = ${table.game.moveCount}`
	)
);

/**
 * Recompute `user_profile.best_score` from classic games (active or finished).
 *
 * Profile best is a cache for personal UI only — all-time leaderboard aggregates
 * from `game` rows. Only replayable games count (seed + matching move history).
 * Incomplete runs count: score only increases within a game.
 * Never trust a client-submitted score here (that path used to allow inflated
 * highs without a matching game).
 *
 * @param {string} userId
 * @returns {Promise<number | null>} The recomputed best score, or null if none
 */
export async function syncBestScoreFromGames(userId) {
	const userProfile = db
		.select()
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, userId))
		.get();

	assert(userProfile, "User profile not found");

	const bestRow = db
		.select({
			bestScore: sql`max(${table.game.score})`,
		})
		.from(table.game)
		.where(
			and(eq(table.game.playerId, userId), sql`${table.game.score} is not null`, gameHasReplaySql)
		)
		.get();

	const rawBest = bestRow?.bestScore;
	const bestScore =
		typeof rawBest === "number" && Number.isFinite(rawBest)
			? rawBest
			: typeof rawBest === "string" && rawBest !== "" && Number.isFinite(Number(rawBest))
				? Number(rawBest)
				: null;

	await db.update(table.userProfile).set({ bestScore }).where(eq(table.userProfile.userId, userId));

	return bestScore;
}

/**
 * @deprecated Prefer syncBestScoreFromGames — client-submitted scores are ignored.
 * Kept as the `/game?/saveScore` action target for older clients.
 * @param {number} _score
 * @param {string} userId
 */
export async function saveScore(_score, userId) {
	await syncBestScoreFromGames(userId);
}

/**
 * Normalize moves for persistence
 * @param {number[] | null | undefined} moves
 * @returns {number[] | null}
 */
function normalizeMoves(moves) {
	if (moves === null) return null;
	if (Array.isArray(moves)) return moves;
	return [];
}

/**
 * Whether a saved game can be deterministically replayed from seed + moves
 * @param {{ seed: number | null, moves: number[] | null, moveCount: number }} game
 */
export function gameHasReplay(game) {
	return (
		game.seed != null &&
		Array.isArray(game.moves) &&
		game.moves.length > 0 &&
		game.moves.length === game.moveCount
	);
}

/**
 * Mark every other in-progress game for this user as complete.
 *
 * A player should only have one active (`complete !== true`) run. Older incomplete
 * rows (e.g. abandoned after Keep Playing → New Game) are finalized so history
 * shows them as finished rather than competing "active" sessions.
 *
 * Performance: one UPDATE by player_id; usually matches 0 rows.
 *
 * @param {string} userId
 * @param {string} exceptGameId The game that should remain in progress
 */
export async function abandonOtherInProgressGames(userId, exceptGameId) {
	await db
		.update(table.game)
		.set({
			complete: true,
			// Preserve win-time stamp when present; otherwise use last play time
			completedOn: sql`coalesce(${table.game.completedOn}, ${table.game.updatedOn})`,
		})
		.where(
			and(
				eq(table.game.playerId, userId),
				not(eq(table.game.complete, true)),
				ne(table.game.id, exceptGameId)
			)
		);
}

/**
 * Save a game to the database.
 *
 * Creates a game if the id is not in the database.
 *
 * Updates a game otherwise. Checks won flag and sets completedOn date if the game was won.
 *
 *
 * @param {import("$lib/types").GameSaveData} game
 * @returns {Promise<string>} The id of the saved game
 */
export async function saveGame(game) {
	let existingGame = null;

	if (game.id) {
		existingGame = db.select().from(table.game).where(eq(table.game.id, game.id)).get();
		assert(existingGame, `Game with id ${game.id} not found`);
	}

	const moves = normalizeMoves(game.moves);

	// If game with id already exists, check for completion and update the game
	if (game.id && existingGame) {
		let completedOn = existingGame.completedOn;
		// Stamp completedOn the first time a game finishes (win or loss)
		if (!existingGame.complete && game.complete) {
			completedOn = new Date();
		} else if (!existingGame.won && game.won && !completedOn) {
			completedOn = new Date();
		}

		await db
			.update(table.game)
			.set({
				board: game.board,
				score: game.score,
				won: game.won,
				complete: game.complete,
				seed: game.seed ?? null,
				rngState: game.rngState ?? null,
				moveCount: game.moveCount ?? 0,
				undoCooldownRemaining: game.undoCooldownRemaining ?? 0,
				moves,
				completedOn,
				updatedOn: new Date(),
			})
			.where(eq(table.game.id, game.id));
	}

	// If game did not exist in db, create it.
	else {
		const now = new Date();
		const newGame = db
			.insert(table.game)
			.values({
				id: crypto.randomUUID(),
				playerId: game.playerId,
				board: game.board,
				score: game.score,
				won: game.won,
				complete: game.complete,
				seed: game.seed ?? null,
				rngState: game.rngState ?? null,
				moveCount: game.moveCount ?? 0,
				undoCooldownRemaining: game.undoCooldownRemaining ?? 0,
				moves,
				createdOn: now,
				updatedOn: now,
				completedOn: game.complete ? now : null,
			})
			.returning({ id: table.game.id })
			.get();

		game.id = newGame.id;
	}

	// Keep a single current run: any other incomplete rows become history
	if (game.id && !game.complete) {
		await abandonOtherInProgressGames(game.playerId, game.id);
		await syncBestScoreFromGames(game.playerId);
	} else if (game.complete && typeof game.score === "number") {
		// Refresh personal best cache from completed runs
		await syncBestScoreFromGames(game.playerId);
	}

	return game.id;
}

/**
 * Get the current game for a user
 *
 * @param {string} userId
 */
export function getCurrentGame(userId) {
	const game = db
		.select()
		.from(table.game)
		.where(and(eq(table.game.playerId, userId), not(eq(table.game.complete, true))))
		.orderBy(desc(table.game.updatedOn))
		.get();

	return game ?? null;
}

/**
 * Derived history status from the `complete` flag.
 * No separate DB status column: `complete === false` means active; true means finished
 * (including abandoned prior runs finalized by New Game / abandonOtherInProgressGames).
 *
 * @param {boolean} complete
 * @returns {import("$lib/types").GameHistoryStatus}
 */
export function gameHistoryStatus(complete) {
	return complete ? "finished" : "active";
}

/**
 * List games for history (Pro feature) — active and finished.
 *
 * Status is derived (`active` | `finished`) from `complete`; we do not store a
 * separate status enum unless abandoned needs to differ from finished later.
 *
 * @param {string} userId
 * @param {{
 *   sort?: import("$lib/types").GameHistorySort,
 *   filter?: import("$lib/types").GameHistoryFilter,
 *   limit?: number,
 *   offset?: number,
 * }} [options]
 * @returns {import("$lib/types").GameHistoryEntry[]}
 */
export function getGameHistory(userId, options = {}) {
	const sort = options.sort ?? "date";
	const filter = options.filter ?? "all";
	const limit = options.limit ?? 50;
	const offset = options.offset ?? 0;

	/** @type {import("drizzle-orm").SQL[]} */
	const conditions = [eq(table.game.playerId, userId)];
	if (filter === "active") {
		conditions.push(not(eq(table.game.complete, true)));
	} else if (filter === "won") {
		conditions.push(eq(table.game.won, true));
	} else if (filter === "lost") {
		conditions.push(eq(table.game.won, false), eq(table.game.complete, true));
	}

	/** @type {import("drizzle-orm").SQL[]} */
	let orderBy;
	if (sort === "score") {
		orderBy = [desc(table.game.score), desc(table.game.updatedOn)];
	} else if (sort === "moves") {
		orderBy = [desc(table.game.moveCount), desc(table.game.updatedOn)];
	} else {
		// Last activity — works for active runs and finished ones alike
		orderBy = [desc(table.game.updatedOn)];
	}

	const rows = db
		.select({
			id: table.game.id,
			score: table.game.score,
			won: table.game.won,
			complete: table.game.complete,
			moveCount: table.game.moveCount,
			createdOn: table.game.createdOn,
			updatedOn: table.game.updatedOn,
			completedOn: table.game.completedOn,
			seed: table.game.seed,
			moves: table.game.moves,
		})
		.from(table.game)
		.where(and(...conditions))
		.orderBy(...orderBy)
		.limit(limit)
		.offset(offset)
		.all();

	return rows.map((row) => ({
		id: row.id,
		score: row.score ?? 0,
		won: row.won,
		complete: row.complete,
		status: gameHistoryStatus(row.complete),
		moveCount: row.moveCount,
		createdOn: row.createdOn,
		updatedOn: row.updatedOn,
		completedOn: row.completedOn,
		hasReplay: gameHasReplay({
			seed: row.seed,
			moves: row.moves,
			moveCount: row.moveCount,
		}),
	}));
}

/**
 * @deprecated Use {@link getGameHistory}
 * @param {string} userId
 * @param {Parameters<typeof getGameHistory>[1]} [options]
 */
export function getCompletedGames(userId, options = {}) {
	return getGameHistory(userId, options);
}

/**
 * Get a game owned by the user (for replay of finished or in-progress runs)
 *
 * @param {string} gameId
 * @param {string} userId
 */
export function getOwnedGameById(gameId, userId) {
	const game = db
		.select()
		.from(table.game)
		.where(and(eq(table.game.id, gameId), eq(table.game.playerId, userId)))
		.get();

	return game ?? null;
}

/**
 * @deprecated Use {@link getOwnedGameById}
 * @param {string} gameId
 * @param {string} userId
 */
export function getCompletedGameById(gameId, userId) {
	return getOwnedGameById(gameId, userId);
}
