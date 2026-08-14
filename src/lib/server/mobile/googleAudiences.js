/**
 * Resolve accepted Google ID-token audiences from env.
 *
 * Accepts any of:
 * - GOOGLE_CLIENT_IDS — comma-separated list (preferred)
 * - GOOGLE_IOS_CLIENT_ID — iOS OAuth client (mobile ID-token `aud`)
 * - GOOGLE_CLIENT_ID — web OAuth client (optional)
 *
 * @param {Record<string, string | undefined> | object} envMap
 * @returns {string[]}
 */
export function resolveGoogleAudiences(envMap) {
	const record = /** @type {Record<string, string | undefined>} */ (envMap);
	const ids = [
		...(record.GOOGLE_CLIENT_IDS || "").split(","),
		record.GOOGLE_IOS_CLIENT_ID,
		record.GOOGLE_CLIENT_ID
	]
		.map((s) => (typeof s === "string" ? s.trim() : ""))
		.filter(Boolean);
	return [...new Set(ids)];
}
