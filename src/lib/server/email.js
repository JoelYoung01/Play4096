import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";
import { logger } from "./logger.js";

/** @type {import("nodemailer").Transporter | null} */
let cachedTransporter = null;

/**
 * Get or create a singleton SMTP transporter, configured from env vars.
 * Returns null if not sufficiently configured.
 *
 * Expected env vars:
 * - SMTP_SERVER
 * - SMTP_PORT
 * - SMTP_USERNAME
 * - SMTP_PASSWORD
 * - FROM_EMAIL (e.g. "Play4096 <no-reply@play-4096.com>")
 */
function getTransporter() {
	if (cachedTransporter) return cachedTransporter;

	const host = env.SMTP_SERVER;
	const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
	const user = env.SMTP_USERNAME;
	const pass = env.SMTP_PASSWORD;

	// Derive secure from port (465 is secure, 587 is not)
	const secure = port === 465;

	if (!host || !port || !user || !pass) {
		logger.warn(
			"SMTP not fully configured (missing one of SMTP_SERVER/SMTP_PORT/SMTP_USERNAME/SMTP_PASSWORD). Emails will be skipped in non-production."
		);
		return null;
	}

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});

	return cachedTransporter;
}

/**
 * Sends a plain-text email using nodemailer. In development/missing-config, it logs and no-ops.
 *
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 * @returns {Promise<void>}
 */
export async function sendEmail(to, subject, body, useHtml = false) {
	const from = env.FROM_EMAIL;
	const environment = env.ENVIRONMENT || "development";

	if (!to || !subject || !body) {
		throw new Error("sendEmail requires non-empty to, subject, and body");
	}

	const transporter = getTransporter();
	if (!transporter) {
		if (environment === "production") {
			throw new Error("SMTP is not configured in production environment");
		}
		logger.debug({ to, subject }, "Skipping email send (SMTP not configured)");
		return;
	}

	if (!from) {
		if (environment === "production") {
			throw new Error("FROM_EMAIL is required in production");
		}
		logger.warn("FROM_EMAIL not set. Using SMTP_USERNAME as from address for development.");
	}

	let textBody = body;
	if (useHtml) {
		textBody = body.replace(/<[^>]*>?/g, "");
	}

	try {
		const info = await transporter.sendMail({
			from: from || env.SMTP_USERNAME,
			to,
			subject,
			text: textBody,
			html: useHtml ? body : undefined,
		});
		logger.info({ to, subject, messageId: info.messageId }, "Email sent");
	} catch (error) {
		logger.error({ err: error, to, subject }, "Failed to send email");
		throw error;
	}
}
