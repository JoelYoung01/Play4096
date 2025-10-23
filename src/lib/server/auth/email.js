import { db } from "$lib/server/db";
import { count, eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";

/** @param {string} email */
export function verifyEmailInput(email) {
	return /^.+@.+\..+$/.test(email) && email.length < 256;
}

/** @param {string} email */
export function checkEmailAvailability(email) {
	const result = db
		.select({ value: count() })
		.from(table.user)
		.where(eq(table.user.email, email))
		.get();
	return result?.value === 0;
}
