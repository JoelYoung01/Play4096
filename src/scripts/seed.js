import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { user } from "../lib/server/db/schema/index.js";
import { USER_LEVELS } from "../lib/constants.js";

const ADMIN_PASSWORD = "admin123";

/** @param {import("drizzle-orm/better-sqlite3").BetterSQLite3Database} db */
async function seedUsers(db) {
	const adminUser = {
		id: "admin",
		username: "admin",
		email: "admin@example.com",
		admin: true,
		level: USER_LEVELS.PRO,
		passwordHash: await hash(ADMIN_PASSWORD, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		}),
	};

	await db.insert(user).values(adminUser);
}

async function main() {
	const db = drizzle("data/local.db");

	await seedUsers(db);
}

main();
