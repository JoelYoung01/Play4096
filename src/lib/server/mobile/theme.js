import { USER_LEVELS } from "$lib/constants";
import { getTheme, resolveTheme } from "$lib/assets/themes";
import { getUserProfile } from "$lib/server/user";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Persist theme for a user (mobile — no cookies).
 * @param {string} userId
 * @param {string} themeId
 */
export async function setThemeForUser(userId, themeId) {
	const theme = getTheme(themeId);
	if (theme.id !== themeId) {
		return { ok: false, error: "Unknown theme" };
	}

	const profile = getUserProfile(userId);
	const isPro = profile?.level === USER_LEVELS.PRO;
	if (theme.pro && !isPro) {
		return { ok: false, error: "That theme requires Pro" };
	}

	const resolved = resolveTheme(themeId, isPro);
	await db
		.update(table.userProfile)
		.set({ themeId: resolved.id })
		.where(eq(table.userProfile.userId, userId));

	return { ok: true, themeId: resolved.id };
}
