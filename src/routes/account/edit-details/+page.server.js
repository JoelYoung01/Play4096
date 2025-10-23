import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { getUser, getUserProfile } from "$lib/server/user";

export function load({ locals }) {
	if (!locals.user) {
		return fail(401, { message: "Not logged in" });
	}

	const userProfile = getUserProfile(locals.user.id);

	if (!userProfile) {
		return fail(401, { message: `Unable to find user profile with Id ${locals.user.id}` });
	}

	const formData = {
		displayName: userProfile.displayName ?? "",
		email: userProfile.email ?? "",
	};

	return { formData };
}

export const actions = {
	editDetails: editDetailsAction,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function editDetailsAction({ request, locals }) {
	if (!locals.user) {
		return fail(401, { message: "Not logged in" });
	}

	const user = getUser(locals.user.id);

	if (!user) {
		return fail(401, { message: `Unable to find user with Id ${locals.user.id}` });
	}

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
	}

	await db.update(table.user).set(payload).where(eq(table.user.id, locals.user.id));
	await db
		.update(table.userProfile)
		.set(payload)
		.where(eq(table.userProfile.userId, locals.user.id));

	return {
		email,
		displayName,
		success: true,
	};
}
