import { fail } from "@sveltejs/kit";
import { getUser } from "$lib/server/user";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { updateUserPassword } from "$lib/server/auth/user.js";

export const actions = {
	updatePassword: updatePasswordAction,
};

/** @param {import("@sveltejs/kit").RequestEvent} event */
async function updatePasswordAction({ request, locals }) {
	if (!locals.user) {
		return fail(401, { message: "Not logged in" });
	}

	const user = getUser(locals.user.id);

	if (!user) {
		return fail(401, { message: `Unable to find user with Id ${locals.user.id}` });
	}

	const formData = await request.formData();
	const currentPassword = formData.get("currentPassword")?.toString() ?? "";
	const newPassword = formData.get("newPassword")?.toString() ?? "";

	const validPassword = await verifyPasswordHash(user.passwordHash, currentPassword);
	if (!validPassword) {
		return fail(401, { message: "Invalid current password" });
	}

	await updateUserPassword(locals.user.id, newPassword);

	return { success: true };
}
