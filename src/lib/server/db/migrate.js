import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";

import { getDb } from "./index.js";

const MIGRATIONS_TABLE = "__drizzle_migrations";

/**
 * Resolve the migrations folder shipped with the app image / repo.
 * @returns {string}
 */
export function getMigrationsFolder() {
	const candidates = [
		path.join(process.cwd(), "drizzle"),
		path.resolve("drizzle"),
		path.join(process.cwd(), "..", "drizzle"),
	];

	for (const folder of candidates) {
		if (existsSync(path.join(folder, "meta", "_journal.json"))) {
			return folder;
		}
	}

	throw new Error("Unable to locate drizzle migrations folder");
}

/**
 * @returns {{ tag: string, when: number, idx: number }[]}
 */
function readJournalEntries(migrationsFolder = getMigrationsFolder()) {
	const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
	const journal = JSON.parse(readFileSync(journalPath, "utf8"));
	return journal.entries ?? [];
}

/**
 * @returns {string[]} Applied migration hashes (oldest first)
 */
function getAppliedHashes() {
	const db = getDb();
	try {
		const rows = /** @type {{ hash: string }[]} */ (
			db.$client.prepare(`SELECT hash FROM ${MIGRATIONS_TABLE} ORDER BY created_at ASC`).all()
		);
		return rows.map((row) => String(row.hash));
	} catch {
		// Table missing on a brand-new DB — treat as zero applied
		return [];
	}
}

/**
 * Migration status relative to the journal packaged with this build.
 * @returns {{
 *   migrationsFolder: string,
 *   journal: { tag: string, when: number, idx: number }[],
 *   appliedCount: number,
 *   pendingCount: number,
 *   pending: { tag: string, when: number, idx: number }[],
 * }}
 */
export function getMigrationStatus() {
	const migrationsFolder = getMigrationsFolder();
	const journal = readJournalEntries(migrationsFolder);
	const files = readMigrationFiles({ migrationsFolder });
	const applied = new Set(getAppliedHashes());

	const pending = [];
	for (let i = 0; i < files.length; i++) {
		if (!applied.has(files[i].hash)) {
			pending.push(journal[i] ?? { tag: `unknown-${i}`, when: files[i].folderMillis, idx: i });
		}
	}

	return {
		migrationsFolder,
		journal,
		appliedCount: applied.size,
		pendingCount: pending.length,
		pending,
	};
}

/**
 * Apply all pending migrations (drizzle "up").
 * @returns {{ before: ReturnType<typeof getMigrationStatus>, after: ReturnType<typeof getMigrationStatus> }}
 */
export function migrateUp() {
	const migrationsFolder = getMigrationsFolder();
	const before = getMigrationStatus();

	migrate(getDb(), { migrationsFolder });

	const after = getMigrationStatus();
	return { before, after };
}
