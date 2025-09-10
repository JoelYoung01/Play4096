import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
});

export const userProfile = sqliteTable("user_profile", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	displayName: text("display_name"),
	avatarUrl: text("avatar_url"),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const game = sqliteTable("game", {
	id: text("id").primaryKey(),
	playerId: text("player_id")
		.notNull()
		.references(() => user.id),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	completedOn: integer("completed_on", { mode: "timestamp" }),
	score: integer("score"),
	won: integer("won", { mode: "boolean" }).notNull(),
	complete: integer("complete", { mode: "boolean" }).notNull(),
	boardJson: text("board_json", { mode: "json" }).notNull(),
});
