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
});
