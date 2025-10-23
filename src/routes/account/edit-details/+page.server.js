import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireLogin } from "$lib/server/user";

/** @type {import("./$types").PageServerLoad} */
export async function load({ parent }) {
	const { userProfile } = await parent();

	const response = {
		formData: {
			displayName: userProfile.displayName ?? "",
			email: userProfile.email ?? "",
		},
	};

	return response;
}

export const actions = {
	editDetails: editDetailsAction,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function editDetailsAction({ request }) {
	const user = requireLogin();

	const formData = await request.formData();
	const displayName = formData.get("displayName")?.toString() ?? "";
	const email = formData.get("email")?.toString() ?? "";

	const payload = {
		email,
		displayName,
		emailVerified: user.emailVerified,
	};

	if (email !== user.email) {
		payload.emailVerified = false;

		if (email) {
			const existingEmail = db.select().from(table.user).where(eq(table.user.email, email)).get();
			if (existingEmail) {
				return fail(400, { message: "Email already in use" });
			}
		}
	}

	await db.update(table.user).set(payload).where(eq(table.user.id, user.id));
	await db.update(table.userProfile).set(payload).where(eq(table.userProfile.userId, user.id));

	return {
		email,
		displayName,
		success: true,
	};
}
