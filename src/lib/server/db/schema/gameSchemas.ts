import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

/** Game table schema */
export const game = sqliteTable("game", {
	id: text("id").primaryKey(),
	playerId: text("player_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	updatedOn: integer("updated_on", { mode: "timestamp" }).notNull(),
	completedOn: integer("completed_on", { mode: "timestamp" }),
	score: integer("score"),
	won: integer("won", { mode: "boolean" }).notNull(),
	complete: integer("complete", { mode: "boolean" }).notNull(),
	board: text("board", { mode: "json" }).$type<number[][]>().notNull(),
	/** Recorded move directions (see DIRECTIONS) for Pro replay — null when not replayable */
	moves: text("moves", { mode: "json" }).$type<number[] | null>(),
	seed: integer("seed"),
	rngState: integer("rng_state"),
	moveCount: integer("move_count").notNull().default(0),
	undoCooldownRemaining: integer("undo_cooldown_remaining").notNull().default(0),
});

/**
 * Checkpoint snapshots for a game run.
 *
 * Only one row per game should have isActive=true at a time (the restore target).
 * Superseded rows are retained for analytics and are not restorable in the UI.
 */
export const gameCheckpoint = sqliteTable("game_checkpoint", {
	id: text("id").primaryKey(),
	playerId: text("player_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	gameId: text("game_id")
		.notNull()
		.references(() => game.id, { onDelete: "cascade" }),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	board: text("board", { mode: "json" }).$type<number[][]>().notNull(),
	score: integer("score").notNull(),
	seed: integer("seed"),
	rngState: integer("rng_state"),
	moveCount: integer("move_count").notNull().default(0),
	undoCooldownRemaining: integer("undo_cooldown_remaining").notNull().default(0),
	won: integer("won", { mode: "boolean" }).notNull().default(false),
});
