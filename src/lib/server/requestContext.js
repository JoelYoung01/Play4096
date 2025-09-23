import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

export const requestContext = new AsyncLocalStorage();

/**
 *
 * @param {Request} req
 * @param {() => any} fn
 */
export function withRequestContext(req, fn) {
	const requestId = req?.headers?.get("x-request-id") ?? randomUUID();
	const requestLogger = logger.child({
		requestId,
		path: req?.url,
		method: req?.method,
	});
	return requestContext.run({ requestId, logger: requestLogger }, fn);
}

/**
 * Get the logger for the current request
 * @returns {import("pino").Logger}
 */
export function getLogger() {
	return requestContext.getStore()?.logger ?? logger;
}
