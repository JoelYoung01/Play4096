import { encodeBase32LowerCase } from "@oslojs/encoding";


/**
 * Generate a random user ID.
 * @returns {string}
 */
export function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

/**
 * Validate Username. Returns truthy (error message) if invalid, falsey (no error) if valid.
 * @param {FormDataEntryValue | null} username
 * @returns {{username: string, errors: string[]}}
 */
export function validateUsername(username) {
	const errors = [];
	if (typeof username !== "string") {
		errors.push("Not a string");
		return { username: "", errors };
	}

	if (username.length < 3 || username.length > 31)
		errors.push(`Username must be between 3 and 31 characters (found ${username.length})`);
	if (!/^[a-zA-Z0-9@._-]+$/.test(username))
		errors.push(`Username ${username} must be alphanumeric`);

	return { username, errors };
}

/**
 * Validate Password. Returns truthy (error message) if invalid, falsey (no error) if valid.
 * @param {FormDataEntryValue | null} password
 * @returns {{password: string, errors: string[]}}
 */
export function validatePassword(password) {
	const errors = [];
	if (typeof password !== "string") {
		errors.push("Not a string");
		return { password: "", errors };
	}

	if (password.length < 6 || password.length > 255)
		errors.push(`Password must be between 6 and 255 characters`);
	return { password, errors };
}
