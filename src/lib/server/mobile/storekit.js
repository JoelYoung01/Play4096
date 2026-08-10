import { createRemoteJWKSet, jwtVerify, decodeProtectedHeader, importX509 } from "jose";
import { eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";

import { USER_LEVELS } from "$lib/constants";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

/**
 * Apple's App Store Server API JWS keys (StoreKit 2 signed transactions).
 * https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
 */
const appleStoreJwks = createRemoteJWKSet(
	new URL("https://appleid.apple.com/auth/keys")
);

/**
 * Expected product / bundle from env (with sane defaults for local/dev).
 */
export function getIapConfig() {
	return {
		productId: env.APPLE_IAP_PRODUCT_ID || "com.joelyoung.play4096.pro.unlock",
		bundleId: env.APPLE_IAP_BUNDLE_ID || env.APPLE_CLIENT_ID || "com.joelyoung.play4096.pro",
	};
}

/**
 * Decode + verify a StoreKit 2 signed transaction JWS.
 * Falls back to unverified decode in development when signature verification fails
 * (sandbox/local without full Apple chain), so CI/dev can still exercise the path.
 *
 * @param {string} signedTransaction
 * @returns {Promise<{
 *   transactionId: string,
 *   originalTransactionId: string,
 *   productId: string,
 *   bundleId: string,
 *   purchaseDate: number,
 *   environment?: string,
 * }>}
 */
export async function verifySignedTransaction(signedTransaction) {
	if (typeof signedTransaction !== "string" || !signedTransaction.includes(".")) {
		throw new Error("Invalid signed transaction");
	}

	/** @type {Record<string, unknown>} */
	let payload;

	try {
		const header = decodeProtectedHeader(signedTransaction);
		if (header.x5c && Array.isArray(header.x5c) && header.x5c[0]) {
			const certPem = `-----BEGIN CERTIFICATE-----\n${header.x5c[0]}\n-----END CERTIFICATE-----`;
			const key = await importX509(certPem, header.alg || "ES256");
			const verified = await jwtVerify(signedTransaction, key);
			payload = /** @type {Record<string, unknown>} */ (verified.payload);
		} else {
			const verified = await jwtVerify(signedTransaction, appleStoreJwks);
			payload = /** @type {Record<string, unknown>} */ (verified.payload);
		}
	} catch (err) {
		if (env.ENVIRONMENT === "production") {
			throw err;
		}
		// Dev fallback: decode middle segment without verify.
		const parts = signedTransaction.split(".");
		const json = Buffer.from(parts[1], "base64url").toString("utf8");
		payload = JSON.parse(json);
	}

	const transactionId = String(payload.transactionId || "");
	const originalTransactionId = String(payload.originalTransactionId || transactionId);
	const productId = String(payload.productId || "");
	const bundleId = String(payload.bundleId || "");
	const purchaseDate = Number(payload.purchaseDate || Date.now());
	const environment = typeof payload.environment === "string" ? payload.environment : undefined;

	if (!transactionId || !productId) {
		throw new Error("Transaction payload missing required fields");
	}

	const { productId: expectedProduct, bundleId: expectedBundle } = getIapConfig();
	if (productId !== expectedProduct) {
		throw new Error(`Unexpected productId: ${productId}`);
	}
	if (bundleId && bundleId !== expectedBundle) {
		throw new Error(`Unexpected bundleId: ${bundleId}`);
	}

	return {
		transactionId,
		originalTransactionId,
		productId,
		bundleId,
		purchaseDate,
		environment,
	};
}

/**
 * Grant Pro from a verified Apple transaction (idempotent).
 * @param {string} userId
 * @param {Awaited<ReturnType<typeof verifySignedTransaction>>} tx
 */
export async function fulfillAppleTransaction(userId, tx) {
	const existing = db
		.select()
		.from(table.appleTransaction)
		.where(eq(table.appleTransaction.id, tx.transactionId))
		.get();

	if (existing) {
		if (existing.userId !== userId) {
			throw Object.assign(new Error("Transaction already linked to another account"), {
				status: 409,
				code: "TRANSACTION_OWNED",
			});
		}
		// Ensure Pro is still set (idempotent restore).
		await db.update(table.user).set({ level: USER_LEVELS.PRO }).where(eq(table.user.id, userId));
		return { alreadyProcessed: true };
	}

	const now = new Date();
	await db.insert(table.appleTransaction).values({
		id: tx.transactionId,
		userId,
		originalTransactionId: tx.originalTransactionId,
		productId: tx.productId,
		bundleId: tx.bundleId || null,
		environment: tx.environment || null,
		purchasedAt: new Date(tx.purchaseDate),
		createdOn: now,
	});

	await db.update(table.user).set({ level: USER_LEVELS.PRO }).where(eq(table.user.id, userId));
	return { alreadyProcessed: false };
}
