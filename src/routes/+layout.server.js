import { loadThemeForEvent } from "$lib/server/theme";
import { listThemes } from "$lib/assets/themes";

/** @type {import("./$types").LayoutServerLoad} */
export async function load(event) {
	const { theme, themeId, isPro } = loadThemeForEvent(event);

	return {
		theme,
		themeId,
		isPro,
		themes: listThemes().map(
			({ id, name, pro, primary, secondary, background, boardBackground, emptyTile }) => ({
				id,
				name,
				pro: !!pro,
				primary,
				secondary,
				background,
				boardBackground,
				emptyTile,
			})
		),
	};
}
