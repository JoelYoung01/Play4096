import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq, and } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { env } from "$env/dynamic/private";

import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { generateUserId } from "$lib/server/auth/utils";
import { USER_STATUS } from "$lib/constants";
import { resolveGoogleAudiences } from "$lib/server/mobile/googleAudiences";

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/**
 * @returns {string[]}
 */
function appleAudiences() {
	const primary = env.APPLE_CLIENT_ID || "com.joelyoung.4096";
	const extras = (env.APPLE_CLIENT_IDS || "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	return [...new Set([primary, ...extras])];
}

/**
 * @returns {string[]}
 */
function googleAudiences() {
	return resolveGoogleAudiences(env);
}

/**
 * Verify a Sign in with Apple identity token (JWT).
 * @param {string} identityToken
 * @returns {Promise<{ sub: string, email?: string, emailVerified?: boolean }>}
 */
export async function verifyAppleIdentityToken(identityToken) {
	const { payload } = await jwtVerify(identityToken, appleJwks, {
		issuer: "https://appleid.apple.com",
		audience: appleAudiences(),
	});
	if (typeof payload.sub !== "string" || !payload.sub) {
		throw new Error("Apple token missing subject");
	}
	return {
		sub: payload.sub,
		email: typeof payload.email === "string" ? payload.email : undefined,
		emailVerified:
			payload.email_verified === true ||
			payload.email_verified === "true" ||
			payload.email_verified === "1",
	};
}

/**
 * Verify a Google ID token (JWT).
 * @param {string} idToken
 * @returns {Promise<{ sub: string, email?: string, emailVerified?: boolean, name?: string }>}
 */
export async function verifyGoogleIdToken(idToken) {
	const audiences = googleAudiences();
	if (audiences.length === 0) {
		throw new Error(
			"Google sign-in is not configured on the server (set GOOGLE_CLIENT_IDS or GOOGLE_IOS_CLIENT_ID)"
		);
	}
	const { payload } = await jwtVerify(idToken, googleJwks, {
		issuer: ["https://accounts.google.com", "accounts.google.com"],
		audience: audiences,
	});
	if (typeof payload.sub !== "string" || !payload.sub) {
		throw new Error("Google token missing subject");
	}
	return {
		sub: payload.sub,
		email: typeof payload.email === "string" ? payload.email : undefined,
		emailVerified: payload.email_verified === true,
		name: typeof payload.name === "string" ? payload.name : undefined,
	};
}

/**
 * Unusable argon2-looking placeholder so password login fails for OAuth-only users.
 * @returns {Promise<string>}
 */
async function unusablePasswordHash() {
	const random = crypto.getRandomValues(new Uint8Array(32));
	const secret = Buffer.from(random).toString("base64url");
	return hash(secret, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
}

/**
 * Build a unique username from a preferred base.
 * @param {string} base
 */
function uniqueUsername(base) {
	const cleaned = base
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.slice(0, 24);
	const seed = cleaned.length >= 3 ? cleaned : `player${Math.floor(Math.random() * 10000)}`;
	let candidate = seed;
	for (let i = 0; i < 20; i++) {
		const existing = db.select().from(table.user).where(eq(table.user.username, candidate)).get();
		if (!existing) return candidate;
		candidate = `${seed}${Math.floor(Math.random() * 100000)}`.slice(0, 31);
	}
	return `u${generateUserId().slice(0, 14)}`;
}

/**
 * Find or create a user for an OAuth identity.
 * @param {{
 *   provider: "apple" | "google",
 *   providerUserId: string,
 *   email?: string,
 *   emailVerified?: boolean,
 *   displayName?: string | null,
 * }} opts
 */
export async function getOrCreateOAuthUser(opts) {
	const linked = db
		.select()
		.from(table.oauthAccount)
		.where(
			and(
				eq(table.oauthAccount.provider, opts.provider),
				eq(table.oauthAccount.providerUserId, opts.providerUserId)
			)
		)
		.get();

	if (linked) {
		return linked.userId;
	}

	// Link to existing user by verified email when possible.
	let userId = null;
	if (opts.email) {
		const byEmail = db.select().from(table.user).where(eq(table.user.email, opts.email)).get();
		if (byEmail) {
			userId = byEmail.id;
			if (opts.emailVerified && !byEmail.emailVerified) {
				await db
					.update(table.user)
					.set({ emailVerified: true })
					.where(eq(table.user.id, userId));
			}
		}
	}

	if (!userId) {
		userId = generateUserId();
		const usernameBase =
			opts.displayName ||
			(opts.email ? opts.email.split("@")[0] : null) ||
			`${opts.provider}${opts.providerUserId.slice(0, 8)}`;
		const username = uniqueUsername(usernameBase);
		const passwordHash = await unusablePasswordHash();

		await db.insert(table.user).values({
			id: userId,
			username,
			email: opts.email ?? null,
			passwordHash,
			emailVerified: Boolean(opts.email && opts.emailVerified),
			status: USER_STATUS.ACTIVE,
		});

		await db.insert(table.userProfile).values({
			id: userId,
			userId,
			displayName: opts.displayName || null,
		});
	} else {
		const profile = db
			.select()
			.from(table.userProfile)
			.where(eq(table.userProfile.userId, userId))
			.get();
		if (!profile) {
			await db.insert(table.userProfile).values({
				id: userId,
				userId,
				displayName: opts.displayName || null,
			});
		} else if (opts.displayName && !profile.displayName) {
			await db
				.update(table.userProfile)
				.set({ displayName: opts.displayName })
				.where(eq(table.userProfile.userId, userId));
		}
	}

	await db.insert(table.oauthAccount).values({
		id: generateUserId(),
		userId,
		provider: opts.provider,
		providerUserId: opts.providerUserId,
		createdOn: new Date(),
	});

	return userId;
}
