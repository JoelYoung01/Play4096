import { getUser } from "$lib/server/user";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { updateUserPassword } from "$lib/server/auth/user.js";
import { validatePassword } from "$lib/server/auth/utils.js";
import { err, ok, readJson } from "$lib/server/mobile/http";

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);

	const user = getUser(locals.user.id);
	if (!user) return err("User not found", 404);
	if (!user.passwordHash) return err("This account uses Sign in with Apple or Google.", 400);

	const body = await readJson(request);
	const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
	const newPasswordRaw = typeof body?.newPassword === "string" ? body.newPassword : "";

	const validCurrent = await verifyPasswordHash(user.passwordHash, currentPassword);
	if (!validCurrent) return err("Invalid current password", 401);

	const { password, errors } = validatePassword(newPasswordRaw);
	if (errors.length) return err(`Invalid password: ${errors.join(", ")}`);

	await updateUserPassword(locals.user.id, password);
	return ok({ success: true });
}
