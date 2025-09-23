import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

export const requestContext = new AsyncLocalStorage();

/**
 *
 * @param {any} req
 * @param {any} fn
 */
export function withRequestContext(req, fn) {
	const requestId = req?.headers?.["x-request-id"] ?? randomUUID();
	const requestLogger = logger.child({
		requestId,
		path: req?.url,
		method: req?.method,
	});
	return requestContext.run({ requestId, logger: requestLogger }, fn);
}

export function getLogger() {
	return requestContext.getStore()?.logger ?? logger;
}
