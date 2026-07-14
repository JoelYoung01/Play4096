import { THEME_COOKIE_NAME, USER_LEVELS } from "$lib/constants";
import { DEFAULT_THEME_ID, getTheme, resolveTheme } from "$lib/assets/themes";
import { getUserProfile } from "$lib/server/user";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * @param {import("@sveltejs/kit").Cookies} cookies
 * @param {string} themeId
 */
export function setThemeCookie(cookies, themeId) {
	cookies.set(THEME_COOKIE_NAME, themeId, {
		path: "/",
		maxAge: THEME_COOKIE_MAX_AGE,
		sameSite: "lax",
		httpOnly: false, // readable by client for localStorage sync
	});
}

/**
 * @param {import("@sveltejs/kit").Cookies} cookies
 * @returns {string}
 */
export function getThemeIdFromCookie(cookies) {
	const value = cookies.get(THEME_COOKIE_NAME);
	if (value && getTheme(value).id === value) {
		return value;
	}
	return DEFAULT_THEME_ID;
}

/**
 * Resolve the active theme for a request: DB preference (logged-in) > cookie > classic.
 * Pro-locked themes fall back to Classic for free users.
 *
 * @param {import("@sveltejs/kit").RequestEvent} event
 */
export function loadThemeForEvent(event) {
	const cookieThemeId = getThemeIdFromCookie(event.cookies);
	let themeId = cookieThemeId;
	let isPro = false;

	if (event.locals.user) {
		const profile = getUserProfile(event.locals.user.id);
		isPro = profile?.level === USER_LEVELS.PRO;
		if (profile?.themeId) {
			themeId = profile.themeId;
		}
	}

	const theme = resolveTheme(themeId, isPro);

	if (theme.id !== cookieThemeId) {
		setThemeCookie(event.cookies, theme.id);
	}

	return {
		theme,
		themeId: theme.id,
		isPro,
	};
}

/**
 * Persist a theme selection for the current request (cookie always; DB when logged in).
 * @param {import("@sveltejs/kit").RequestEvent} event
 * @param {string} themeId
 * @returns {Promise<{ ok: true, themeId: string } | { ok: false, error: string }>}
 */
export async function setThemePreference(event, themeId) {
	const theme = getTheme(themeId);
	if (theme.id !== themeId) {
		return { ok: false, error: "Unknown theme" };
	}

	let isPro = false;
	if (event.locals.user) {
		const profile = getUserProfile(event.locals.user.id);
		isPro = profile?.level === USER_LEVELS.PRO;
	}

	if (theme.pro && !isPro) {
		return { ok: false, error: "That theme requires Pro" };
	}

	const resolved = resolveTheme(themeId, isPro);
	setThemeCookie(event.cookies, resolved.id);

	if (event.locals.user) {
		await db
			.update(table.userProfile)
			.set({ themeId: resolved.id })
			.where(eq(table.userProfile.userId, event.locals.user.id));
	}

	return { ok: true, themeId: resolved.id };
}
