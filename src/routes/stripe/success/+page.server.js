import { fulfillCheckout } from "$lib/server/stripe";
import { redirect } from "@sveltejs/kit";
import assert from "node:assert";

export async function load({ url }) {
	const sessionId = url.searchParams.get("sessionId");
	assert(!!sessionId, "sessionId is not set");
	await fulfillCheckout(sessionId);
	redirect(302, "/account");
}
