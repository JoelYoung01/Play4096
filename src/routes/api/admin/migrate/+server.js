import { json } from "@sveltejs/kit";

import { ExpiringTokenBucket } from "$lib/server/auth/rateLimit.js";
import { getUser } from "$lib/server/user.js";
import { getMigrationStatus, migrateUp } from "$lib/server/db/migrate.js";
import { getLogger } from "$lib/server/requestContext.js";

/** Few migrations per hour — enough for emergencies, not spam */
const migrateBucket = new ExpiringTokenBucket(3, 60 * 60);

/**
 * @param {import("@sveltejs/kit").RequestEvent} event
 */
function requireAdmin(event) {
	if (!event.locals.user) {
		return json({ error: "Not logged in" }, { status: 401 });
	}

	const user = getUser(event.locals.user.id);
	if (!user?.admin) {
		return json({ error: "Admin access required" }, { status: 403 });
	}

	return null;
}

/** @type {import("./$types").RequestHandler} */
export async function GET(event) {
	const denied = requireAdmin(event);
	if (denied) return denied;

	try {
		return json({ success: true, status: getMigrationStatus() });
	} catch (err) {
		getLogger().error({ err }, "Failed to read migration status");
		return json({ error: "Failed to read migration status" }, { status: 500 });
	}
}

/** @type {import("./$types").RequestHandler} */
export async function POST(event) {
	const denied = requireAdmin(event);
	if (denied) return denied;

	const userId = event.locals.user.id;

	/** @type {{ command?: string }} */
	let body = {};
	try {
		body = await event.request.json();
	} catch {
		return json({ error: "JSON body required" }, { status: 400 });
	}

	const command = body.command;
	if (command !== "up") {
		return json(
			{
				error: 'Unsupported command. Use { "command": "up" } to apply pending migrations.',
			},
			{ status: 400 }
		);
	}

	// Burn quota before running migrate to limit expensive / damaging retries
	if (!migrateBucket.consume(userId, 1) || !migrateBucket.consume("global", 1)) {
		return json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
	}

	const log = getLogger();
	try {
		const result = migrateUp();
		log.info(
			{
				userId,
				pendingBefore: result.before.pendingCount,
				pendingAfter: result.after.pendingCount,
				appliedAfter: result.after.appliedCount,
			},
			"Admin ran database migrate up"
		);

		return json({
			success: true,
			command: "up",
			applied: result.before.pendingCount - result.after.pendingCount,
			before: result.before,
			after: result.after,
		});
	} catch (err) {
		log.error({ err, userId }, "Admin migrate up failed");
		return json(
			{
				error: "Migration failed",
				message: err instanceof Error ? err.message : String(err),
			},
			{ status: 500 }
		);
	}
}
