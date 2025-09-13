import stripe from "stripe";
import assert from "node:assert";
import { error, json } from "@sveltejs/kit";
import { cancelCheckout, fulfillCheckout } from "$lib/server/stripe";
import { env } from "$env/dynamic/private";

/** @type {import("./$types").RequestHandler} */
export const POST = async ({ request }) => {
	console.debug("Stripe Webhook received");
	const payload = await request.text();
	const sig = request.headers.get("stripe-signature");

	let event;

	try {
		assert(!!sig, "stripe-signature is not set");
		assert(!!env.STRIPE_ENDPOINT_SECRET, "STRIPE_ENDPOINT_SECRET is not set");

		event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_ENDPOINT_SECRET);
	} catch (err) {
		error(400, {
			message: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
		});
	}

	// If checkout session is completed or async payment succeeded, fulfill the checkout
	if (
		event.type === "checkout.session.completed" ||
		event.type === "checkout.session.async_payment_succeeded"
	) {
		fulfillCheckout(event.data.object.id);
	}

	// If the checkout session is cancelled or expired, cancel the checkout
	else if (
		event.type === "checkout.session.async_payment_failed" ||
		event.type === "checkout.session.expired"
	) {
		cancelCheckout(event.data.object.id, true);
	}

	// Log unhandled event types
	else {
		console.debug("Stripe Webhook received but not handled: " + event.type);
	}

	return json({ message: "Webhook received", received: true });
};
