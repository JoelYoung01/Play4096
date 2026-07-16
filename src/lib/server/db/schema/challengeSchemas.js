import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

/**
 * Persisted daily challenge definitions (one per Central-Time calendar day).
 * `id` is `daily-YYYY-MM-DD`.
 */
export const dailyChallenge = sqliteTable(
	"daily_challenge",
	{
		id: text("id").primaryKey(),
		/** YYYY-MM-DD in America/Chicago */
		challengeDate: text("challenge_date").notNull(),
		type: text("type").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull(),
		difficulty: text("difficulty").notNull(),
		params: text("params", { mode: "json" }).notNull(),
		createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	},
	(t) => [uniqueIndex("daily_challenge_date_uidx").on(t.challengeDate)]
);

/** Challenge attempt / run attribution for logged-in Pro users */
export const challengeRun = sqliteTable("challenge_run", {
	id: text("id").primaryKey(),
	challengeId: text("challenge_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: text("status").notNull(),
	/**
	 * Ranking metric for wins: elapsed ms for time challenges, move count for recovery.
	 * Merge points live in metrics.mergeScore.
	 */
	score: integer("score").notNull().default(0),
	/** Extra metrics JSON: elapsedMs, filledCells, moveCount, mergeScore, etc. */
	metrics: text("metrics", { mode: "json" }),
	startedOn: integer("started_on", { mode: "timestamp" }).notNull(),
	finishedOn: integer("finished_on", { mode: "timestamp" }),
	updatedOn: integer("updated_on", { mode: "timestamp" }).notNull(),
});
