import { err, ok, readJson } from "$lib/server/mobile/http";
import { fulfillAppleTransaction, verifySignedTransaction } from "$lib/server/mobile/storekit";
import { buildUserPayload } from "$lib/server/mobile/userPayload";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.signedTransaction) {
		return err("signedTransaction is required");
	}

	try {
		const tx = await verifySignedTransaction(body.signedTransaction);
		const result = await fulfillAppleTransaction(locals.user.id, tx);
		const user = buildUserPayload(locals.user.id);
		return ok({
			success: true,
			alreadyProcessed: result.alreadyProcessed,
			transactionId: tx.transactionId,
			user,
		});
	} catch (e) {
		const status = /** @type {{ status?: number, code?: string, message?: string }} */ (e);
		return err(status.message || "IAP verification failed", status.status || 400, {
			code: status.code,
		});
	}
}
