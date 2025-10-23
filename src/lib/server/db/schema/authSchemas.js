import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const emailVerificationRequest = sqliteTable("email_verification_request", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const passwordResetSession = sqliteTable("password_reset_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	code: text("code").notNull(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
