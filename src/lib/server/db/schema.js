import { USER_LEVELS } from "../../constants";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	admin: integer("admin", { mode: "boolean" }).notNull().default(false),
	level: integer("level").notNull().default(USER_LEVELS.FREE),
	passwordHash: text("password_hash").notNull(),
});

export const userProfile = sqliteTable("user_profile", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	displayName: text("display_name"),
	avatarUrl: text("avatar_url"),
	bestScore: integer("best_score"),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const game = sqliteTable("game", {
	id: text("id").primaryKey(),
	playerId: text("player_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	completedOn: integer("completed_on", { mode: "timestamp" }),
	score: integer("score"),
	won: integer("won", { mode: "boolean" }).notNull(),
	complete: integer("complete", { mode: "boolean" }).notNull(),
	boardJson: text("board_json", { mode: "json" }).notNull(),
});

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
