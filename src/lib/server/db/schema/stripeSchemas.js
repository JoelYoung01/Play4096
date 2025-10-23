import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

export const stripeSession = sqliteTable("stripe_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sessionId: text("session_id").notNull(),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	updatedOn: integer("updated_on", { mode: "timestamp" }).notNull(),
	status: text("status").notNull(),
	metadata: text("metadata", { mode: "json" }).notNull(),
	sessionJson: text("session_json", { mode: "json" }).notNull(),
});
