#!/usr/bin/env node
/**
 * Ensure an App Store Connect app exists for the given bundle id.
 * Prints the numeric ASC app id (for `altool --apple-id`) to stdout.
 *
 * Env:
 *   ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY  (or ASC_PRIVATE_KEY_PATH)
 *   ASC_BUNDLE_ID   (default com.joelyoung.4096)
 *   ASC_APP_NAME    (default Play4096)
 *   ASC_APP_SKU     (default play4096)
 */
import crypto from "node:crypto";
import fs from "node:fs";

const keyId = process.env.ASC_KEY_ID;
const issuerId = process.env.ASC_ISSUER_ID;
const bundleId = process.env.ASC_BUNDLE_ID || "com.joelyoung.4096";
const appName = process.env.ASC_APP_NAME || "Play4096";
const sku = process.env.ASC_APP_SKU || "play4096";

function loadPrivateKey() {
	if (process.env.ASC_PRIVATE_KEY_PATH) {
		return fs.readFileSync(process.env.ASC_PRIVATE_KEY_PATH, "utf8");
	}
	const raw = process.env.ASC_PRIVATE_KEY;
	if (!raw) throw new Error("ASC_PRIVATE_KEY or ASC_PRIVATE_KEY_PATH is required");
	return raw.includes("BEGIN") ? raw : raw.replace(/\\n/g, "\n");
}

function makeJwt() {
	const header = { alg: "ES256", kid: keyId, typ: "JWT" };
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: issuerId,
		iat: now,
		exp: now + 20 * 60,
		aud: "appstoreconnect-v1",
	};
	const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
	const unsigned = `${enc(header)}.${enc(payload)}`;
	const key = crypto.createPrivateKey(loadPrivateKey());
	const sig = crypto.sign("SHA256", Buffer.from(unsigned), {
		key,
		dsaEncoding: "ieee-p1363",
	});
	return `${unsigned}.${sig.toString("base64url")}`;
}

async function asc(pathname, { method = "GET", body } = {}) {
	const token = makeJwt();
	const res = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	let json = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { raw: text };
	}
	if (!res.ok) {
		const err = new Error(
			`ASC ${method} ${pathname} → ${res.status}: ${text.slice(0, 800)}`
		);
		err.status = res.status;
		err.body = json;
		throw err;
	}
	return json;
}

/**
 * Exact-match only. ASC's filter[bundleId] can surface sibling ids
 * (e.g. a …4096.pro IAP-adjacent app when querying …4096).
 */
async function findApp() {
	const q = new URLSearchParams({
		"filter[bundleId]": bundleId,
		limit: "50",
	});
	const filtered = await asc(`/v1/apps?${q}`);
	for (const app of filtered?.data ?? []) {
		const bid = app.attributes?.bundleId;
		console.error(
			`filter candidate ${app.id}: bundleId=${bid} name=${app.attributes?.name}`
		);
		if (bid === bundleId) return app;
	}

	// Fallback: scan the account (paginated) for an exact bundle match.
	let next = "/v1/apps?limit=200";
	while (next) {
		const page = await asc(next.startsWith("http") ? new URL(next).pathname + new URL(next).search : next);
		for (const app of page?.data ?? []) {
			const bid = app.attributes?.bundleId;
			if (bid === bundleId) {
				console.error(`scan found ${app.id}: bundleId=${bid}`);
				return app;
			}
		}
		next = page?.links?.next ?? null;
		if (next?.startsWith("http")) {
			const u = new URL(next);
			next = u.pathname + u.search;
		}
	}
	return null;
}

async function findBundleIdResource() {
	const q = new URLSearchParams({
		"filter[identifier]": bundleId,
		limit: "50",
	});
	const data = await asc(`/v1/bundleIds?${q}`);
	for (const row of data?.data ?? []) {
		if (row.attributes?.identifier === bundleId) return row;
	}
	return null;
}

async function ensureBundleId() {
	const existing = await findBundleIdResource();
	if (existing) {
		console.error(`Bundle ID resource exists: ${existing.id}`);
		return existing;
	}
	console.error(`Creating Bundle ID ${bundleId}…`);
	const created = await asc("/v1/bundleIds", {
		method: "POST",
		body: {
			data: {
				type: "bundleIds",
				attributes: {
					identifier: bundleId,
					name: appName.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 50) || "Play4096",
					platform: "IOS",
				},
			},
		},
	});
	return created.data;
}

async function ensureAppleSignInCapability(bundleResourceId) {
	try {
		await asc("/v1/bundleIdCapabilities", {
			method: "POST",
			body: {
				data: {
					type: "bundleIdCapabilities",
					attributes: {
						capabilityType: "APPLE_ID_AUTH",
						settings: [
							{
								key: "APPLE_ID_AUTH_APP_CONSENT",
								options: [{ key: "PRIMARY_APP_CONSENT", enabled: true }],
							},
						],
					},
					relationships: {
						bundleId: {
							data: { type: "bundleIds", id: bundleResourceId },
						},
					},
				},
			},
		});
		console.error("Enabled Sign in with Apple on Bundle ID");
	} catch (err) {
		// Already enabled / unsupported shape — non-fatal; prebuild also requests it.
		console.error(`Sign in with Apple capability note: ${err.message}`);
	}
}

async function createApp(bundleResourceId) {
	console.error(`Creating App Store Connect app "${appName}" (${bundleId})…`);
	// Prefer relationship-based create; fall back to attribute-only if needed.
	try {
		const created = await asc("/v1/apps", {
			method: "POST",
			body: {
				data: {
					type: "apps",
					attributes: {
						name: appName,
						primaryLocale: "en-US",
						sku,
					},
					relationships: {
						bundleId: {
							data: { type: "bundleIds", id: bundleResourceId },
						},
					},
				},
			},
		});
		return created.data;
	} catch (err) {
		if (err.status === 403) {
			throw new Error(
				`ASC API key cannot create apps (forbidden). Create an App Store Connect app with bundle id "${bundleId}" in the portal, or set PLAY4096_IOS_BUNDLE_ID to an existing app's bundle. Original: ${err.message}`
			);
		}
		if (err.status !== 409 && err.status !== 400) throw err;
		console.error("Relationship create failed; retrying with bundleId attribute…");
		const created = await asc("/v1/apps", {
			method: "POST",
			body: {
				data: {
					type: "apps",
					attributes: {
						name: appName,
						primaryLocale: "en-US",
						sku,
						bundleId,
					},
				},
			},
		});
		return created.data;
	}
}

async function main() {
	if (!keyId || !issuerId) {
		throw new Error("ASC_KEY_ID and ASC_ISSUER_ID are required");
	}

	let app = await findApp();
	if (!app) {
		const bundle = await ensureBundleId();
		await ensureAppleSignInCapability(bundle.id);
		app = await createApp(bundle.id);
		// Re-fetch in case create response shape differs
		app = (await findApp()) || app;
	} else {
		console.error(`Found existing ASC app ${app.id} for ${bundleId}`);
	}

	if (!app?.id) {
		throw new Error(`Could not resolve ASC app id for bundle ${bundleId}`);
	}

	// Numeric App Store Connect Apple ID → stdout for altool --apple-id
	process.stdout.write(String(app.id));
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
