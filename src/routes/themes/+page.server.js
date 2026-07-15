import { fail } from "@sveltejs/kit";
import { setThemePreference } from "$lib/server/theme";
import { getTheme } from "$lib/assets/themes";

/** @type {import("./$types").PageServerLoad} */
export async function load({ parent }) {
	const data = await parent();
	// Full theme objects for live preview (tiles etc.)
	return {
		previewThemes: data.themes.map((meta) => getTheme(meta.id)),
	};
}

/** @type {import("./$types").Actions} */
export const actions = {
	setTheme: async (event) => {
		const formData = await event.request.formData();
		const themeId = formData.get("themeId")?.toString() ?? "";

		const result = await setThemePreference(event, themeId);
		if (!result.ok) {
			return fail(400, { theme: { success: false, message: result.error } });
		}

		return { theme: { success: true, themeId: result.themeId } };
	},
};
