import { listThemes, resolveTheme } from "$lib/assets/themes";
import { USER_LEVELS } from "$lib/constants";
import { getUserProfile } from "$lib/server/user";
import { err, ok, readJson } from "$lib/server/mobile/http";
import { setThemeForUser } from "$lib/server/mobile/theme";

/** @type {import("./$types").RequestHandler} */
export async function GET({ locals }) {
	const profile = locals.user ? getUserProfile(locals.user.id) : null;
	const isPro = profile?.level === USER_LEVELS.PRO;
	const themes = listThemes().map((t) => ({
		id: t.id,
		name: t.name,
		pro: Boolean(t.pro),
		locked: Boolean(t.pro) && !isPro,
		primary: t.primary,
		secondary: t.secondary,
		background: t.background,
		boardBackground: t.boardBackground,
		emptyTile: t.emptyTile,
		textLight: t.textLight,
		textDark: t.textDark,
		tiles: t.tiles,
		shadows: t.shadows !== false,
	}));

	const activeId = profile?.themeId
		? resolveTheme(profile.themeId, isPro).id
		: "classic";

	return ok({ themes, activeThemeId: activeId, isPro });
}

/** @type {import("./$types").RequestHandler} */
export async function POST({ locals, request }) {
	if (!locals.user) return err("Not logged in", 401);
	const body = await readJson(request);
	if (!body?.themeId) return err("themeId is required");

	const result = await setThemeForUser(locals.user.id, body.themeId);
	if (!result.ok) return err(result.error, 403);
	return ok({ success: true, themeId: result.themeId });
}
