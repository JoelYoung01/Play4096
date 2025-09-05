import { defaultTheme } from "$lib/assets/themes";

export function load() {
	return {
		theme: defaultTheme,
		bestScore: 0,

		/** @type {number[][] | null} */
		currentGame: null,
	};
}
