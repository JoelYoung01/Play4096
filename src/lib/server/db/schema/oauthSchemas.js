import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./userSchemas.js";

/** Linked Apple / Google identities for a Play4096 user. */
export const oauthAccount = sqliteTable(
	"oauth_account",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(),
		providerUserId: text("provider_user_id").notNull(),
		createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
	},
	(t) => [uniqueIndex("oauth_account_provider_uid").on(t.provider, t.providerUserId)]
);

/** App Store (StoreKit) transactions that granted Pro. */
export const appleTransaction = sqliteTable("apple_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	originalTransactionId: text("original_transaction_id").notNull(),
	productId: text("product_id").notNull(),
	bundleId: text("bundle_id"),
	environment: text("environment"),
	purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull(),
	createdOn: integer("created_on", { mode: "timestamp" }).notNull(),
});
