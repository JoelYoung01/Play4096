import { defaultTheme } from "$lib/assets/themes";

/** @type {import("./$types").LayoutLoad} */
export function load() {
	return {
		theme: defaultTheme,
	};
}
