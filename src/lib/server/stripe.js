import stripe from "stripe";
import assert from "node:assert";
import { env } from "$env/dynamic/private";
import { getBaseUrl } from "$lib/server/config.js";
import { USER_LEVELS } from "$lib/constants";
import { downgradeUser } from "$lib/server/user";

import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";

/**
 * Creates a Stripe checkout session
 * @param {string} userId
 * @returns {Promise<stripe.Checkout.Session>}
 */
export async function createStripeSession(userId) {
	assert(!!env.STRIPE_PRIVATE_KEY, "STRIPE_PRIVATE_KEY is not set");
	assert(!!env.STRIPE_PRICE_ID, "STRIPE_PRICE_ID is not set");

	const stripeClient = new stripe(env.STRIPE_PRIVATE_KEY);

	const session = await stripeClient.checkout.sessions.create({
		line_items: [
			{
				price: env.STRIPE_PRICE_ID,
				quantity: 1,
			},
		],
		mode: "payment",
		success_url: `${getBaseUrl()}/stripe/success?sessionId={CHECKOUT_SESSION_ID}`,
		cancel_url: `${getBaseUrl()}/stripe/cancel?sessionId={CHECKOUT_SESSION_ID}`,
		automatic_tax: { enabled: true },
		metadata: {
			userId: userId,
		},
	});

	// Make sure the user exists
	const user = db
		.select({ id: table.user.id })
		.from(table.user)
		.where(eq(table.user.id, userId))
		.get();

	assert(!!user, "User " + userId + " not found");

	const stripeSession = {
		id: crypto.randomUUID(),
		userId: user.id,
		sessionId: session.id,
		metadata: session.metadata,
		status: session.status ?? "created",
		createdOn: new Date(),
		updatedOn: new Date(),
		sessionJson: JSON.stringify(session),
	};

	await db.insert(table.stripeSession).values(stripeSession);

	return session;
}

/**
 * Cancel a checkout session. This is used to cancel the checkout session if the payment is not successful.
 * @param {string} sessionId
 * @param {boolean} shouldDowngradeUser
 */
export async function cancelCheckout(sessionId, shouldDowngradeUser = false) {
	console.debug("Cancelling Checkout Session " + sessionId);
	const stripeClient = new stripe(env.STRIPE_PRIVATE_KEY);
	const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId);

	if (checkoutSession.status === "complete") {
		console.debug(`Unable to cancel Checkout Session ${sessionId}; it is already complete`);
		return;
	}

	const dbStripeSession = db
		.select()
		.from(table.stripeSession)
		.where(eq(table.stripeSession.sessionId, sessionId))
		.get();

	if (!dbStripeSession) {
		console.debug(`Unable to cancel Checkout Session ${sessionId}; not found in database`);
		return;
	}

	if (dbStripeSession.status === "complete") {
		console.debug(
			`Unable to cancel Checkout Session ${sessionId}; it is already marked as complete (paid) in the db`
		);
		return;
	}

	if (shouldDowngradeUser) {
		await downgradeUser(dbStripeSession.userId);
	}

	await db.delete(table.stripeSession).where(eq(table.stripeSession.sessionId, sessionId));
}

/**
 * Fulfill a checkout session. This is used to fulfill the checkout session after the payment is successful.
 * @param {string} sessionId
 */
export async function fulfillCheckout(sessionId) {
	console.debug("Fulfilling Checkout Session " + sessionId);

	try {
		const stripeClient = new stripe(env.STRIPE_PRIVATE_KEY);

		// Retrieve the Checkout Session from the API with line_items expanded
		const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId, {
			expand: ["line_items"],
		});

		assert(
			!!checkoutSession.metadata?.userId,
			"Checkout Session " + sessionId + " does not have a user ID"
		);

		const [result] = await db
			.select()
			.from(table.stripeSession)
			.where(eq(table.stripeSession.sessionId, sessionId));
		assert(!!result, "Checkout Session " + sessionId + " not found");

		// If the checkout session from the db is already paid, do nothing
		if (result.status === "complete") {
			console.debug("Checkout Session " + sessionId + " is already complete (paid)");
		}

		// If the checkout session is unpaid, do nothing
		else if (checkoutSession.payment_status === "unpaid") {
			console.debug("Checkout Session " + sessionId + " is unpaid");
		}

		// If the checkout session has a user ID, update the user level to PRO
		else {
			const userId = checkoutSession.metadata.userId;
			await db.update(table.user).set({ level: USER_LEVELS.PRO }).where(eq(table.user.id, userId));
			await db
				.update(table.stripeSession)
				.set({
					status: checkoutSession.status ?? "complete",
					updatedOn: new Date(),
					metadata: checkoutSession.metadata,
					sessionJson: JSON.stringify(checkoutSession),
				})
				.where(eq(table.stripeSession.id, result.id));
			console.log("User " + userId + " upgraded to PRO");
		}
	} catch (error) {
		console.error("Error fulfilling checkout session " + sessionId, error);
		throw error;
	}
}
