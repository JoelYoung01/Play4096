import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

/** @type {import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {$client: Database.Database;} | null} */
let dbInstance = null;

/** @returns {import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {$client: Database.Database;}} */
function getDb() {
	if (!dbInstance) {
		if (!env.DATABASE_URL) throw new Error("[DB] DATABASE_URL is not set");
		const client = new Database(env.DATABASE_URL);
		dbInstance = drizzle(client, { schema });
	}
	return dbInstance;
}

export { getDb };

/** @type {import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {$client: Database.Database;}} */
// @ts-expect-error deal with it
export const db = new Proxy(
	{},
	{
		get(target, prop) {
			// @ts-expect-error deal with it
			return getDb()[prop];
		},
	}
);
