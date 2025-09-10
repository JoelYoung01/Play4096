import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import assert from "node:assert";
import { eq } from "drizzle-orm";

export function load({ locals }) {
	const userProfile = db
		.select()
		.from(table.userProfile)
		.where(eq(table.userProfile.userId, locals.user.id))
		.get();

	// This shouldn't be possible, this page should not be accessible to users who are not logged in
	assert(userProfile, "User not found");

	const form = {
		displayName: userProfile.displayName ?? "",
	};

	return { form };
}

export const actions = {
	editDetails: async ({ request, locals }) => {
		const formData = await request.formData();
		const displayName = formData.get("displayName")?.toString() ?? "";

		await db
			.update(table.userProfile)
			.set({ displayName })
			.where(eq(table.userProfile.userId, locals.user.id));

		return redirect(302, "/account");
	},
};
