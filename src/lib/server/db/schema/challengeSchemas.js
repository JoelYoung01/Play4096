import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

/** Challenge attempt / run attribution for logged-in Pro users */
export const challengeRun = sqliteTable("challenge_run", {
	id: text("id").primaryKey(),
	challengeId: text("challenge_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: text("status").notNull(),
	score: integer("score").notNull().default(0),
	/** Extra metrics JSON: elapsedMs, filledCells, moveCount, etc. */
	metrics: text("metrics", { mode: "json" }),
	startedOn: integer("started_on", { mode: "timestamp" }).notNull(),
	finishedOn: integer("finished_on", { mode: "timestamp" }),
	updatedOn: integer("updated_on", { mode: "timestamp" }).notNull(),
});
