import assert from "node:assert";
import { browser } from "$app/environment";
import { env } from "$env/dynamic/private";

/**
 * Get the base URL for the application based on the current environment
 * @returns {string} The base URL for the application
 */
export function getBaseUrl() {
	// This will not run on client
	assert(!browser, "getBaseUrl() should not be called on client");

	// Server-side: use environment-based URL
	const environment = env.ENVIRONMENT || "development";
	return environment === "production" ? "https://play-4096.com" : "http://localhost:5173";
}
