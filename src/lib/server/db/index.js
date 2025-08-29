import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

/** @type {any} */
let dbInstance = null;

function getDb() {
	if (!dbInstance) {
		if (!env.DATABASE_URL) throw new Error("[DB] DATABASE_URL is not set");
		const client = new Database(env.DATABASE_URL);
		dbInstance = drizzle(client, { schema });
	}
	return dbInstance;
}

export { getDb };
export const db = new Proxy({}, {
	get(target, prop) {
		return getDb()[prop];
	}
});
