import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { USER_STATUS, USER_LEVELS } from "../../../constants.js";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	email: text("email").unique(),
	admin: integer("admin", { mode: "boolean" }).notNull().default(false),
	status: integer("status").notNull().default(USER_STATUS.NEW),
	level: integer("level").notNull().default(USER_LEVELS.FREE),
	passwordHash: text("password_hash").notNull(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
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
