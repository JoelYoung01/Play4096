import { json } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import { buildVersion } from "$lib/server/buildInfo.js";
import { db } from "$lib/server/db/index.js";

/** @type {import("./$types").RequestHandler} */
export async function GET() {
	/** @type {Record<string, string>} */
	const checks = {};

	try {
		db.run(sql`SELECT 1`);
		checks.database = "ok";
	} catch (err) {
		checks.database = "error";
		return json(
			{
				status: "unhealthy",
				version: buildVersion,
				checks,
			},
			{ status: 503 },
		);
	}

	return json({
		status: "healthy",
		version: buildVersion,
		checks,
	});
}
