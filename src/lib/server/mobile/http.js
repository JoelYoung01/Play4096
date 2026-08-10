import { json } from "@sveltejs/kit";

/**
 * @param {unknown} data
 * @param {number} [status]
 */
export function ok(data, status = 200) {
	return json(data, { status });
}

/**
 * @param {string} message
 * @param {number} [status]
 * @param {Record<string, unknown>} [extra]
 */
export function err(message, status = 400, extra = {}) {
	return json({ error: message, ...extra }, { status });
}

/**
 * @param {import("@sveltejs/kit").RequestEvent} event
 */
export function requireUser(event) {
	if (!event.locals.user) {
		return null;
	}
	return event.locals.user;
}

/**
 * Parse JSON body; returns null on failure.
 * @param {Request} request
 */
export async function readJson(request) {
	try {
		return await request.json();
	} catch {
		return null;
	}
}
