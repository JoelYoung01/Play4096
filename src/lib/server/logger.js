import pino from "pino";
import { APP_SLUG } from "../constants.js";
import { env } from "$env/dynamic/private";

const isPretty = env.ENVIRONMENT === "development" && env.PINO_PRETTY !== "false";
const transport = isPretty
	? {
			target: "pino-pretty",
			options: {
				colorize: true,
				singleLine: false,
				translateTime: "yyyy-mm-dd HH:MM:ss.l",
				ignore: "pid,hostname",
			},
		}
	: undefined;

export const logger = pino({
	level: env.LOG_LEVEL ?? (env.ENVIRONMENT === "production" ? "info" : "debug"),
	timestamp: pino.stdTimeFunctions.isoTime,
	base: {
		service: APP_SLUG,
		env: env.ENVIRONMENT ?? "development",
	},
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"password",
			"token",
			"*.card",
			"*.cvv",
		],
		censor: "[REDACTED]",
	},
	...(transport ? { transport } : {}),
});

export const basicLogger = pino({
	level: env.LOG_LEVEL ?? (env.ENVIRONMENT === "production" ? "info" : "debug"),
	timestamp: pino.stdTimeFunctions.isoTime,
	base: {},
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"password",
			"token",
			"*.card",
			"*.cvv",
		],
		censor: "[REDACTED]",
	},
	...(transport ? { transport } : {}),
});
