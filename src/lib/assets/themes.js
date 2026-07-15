/**
 * @typedef {Object} Theme
 * @property {string} id
 * @property {string} name
 * @property {boolean} [pro]
 * @property {string} primary
 * @property {string} secondary
 * @property {string} background
 * @property {string} boardBackground
 * @property {string} emptyTile
 * @property {string} textLight
 * @property {string} textDark
 * @property {string} [text]
 * @property {string} unknownTile
 * @property {number} textScale
 * @property {number} luminanceThreshold
 * @property {number} movementSpeed
 * @property {Record<number, string>} tiles
 */

/** Shared tile ramp used by Classic / Light / Soft */
const classicTiles = {
	2: "#eee4d9",
	4: "#ece0c8",
	8: "#f2b179",
	16: "#eb8e53",
	32: "#f67c5f",
	64: "#e95937",
	128: "#f3d96c",
	256: "#f1d14c",
	512: "#efd179",
	1024: "#eece69",
	2048: "#edc32e",
	4096: "#5eda92",
	8192: "#9fca46",
	16384: "#3E5641",
	32768: "#AD9BAA",
	65536: "#5BC0EB",
	131072: "#540D6E",
	262144: "#7B2D26",
	524288: "#065A82",
	1048576: "#F4F7BE",
	2097152: "#63A375",
};

/** @type {Theme} */
export const classicTheme = {
	id: "classic",
	name: "Classic",
	pro: false,
	primary: "#e88f4f",
	secondary: "#C2D4B0",
	background: "#fbf8ef",
	boardBackground: "#bbada0",
	emptyTile: "#cdc1b4",
	textLight: "#776e65",
	textDark: "#f9f6f2",
	text: "#776e65",
	unknownTile: "#5f5f5f",
	textScale: 3,
	luminanceThreshold: 0.7,
	movementSpeed: 50,
	tiles: { ...classicTiles },
};

/** @type {Theme} */
export const darkTheme = {
	id: "dark",
	name: "Dark",
	pro: false,
	primary: "#e88f4f",
	secondary: "#3d5a45",
	background: "#1a1a1e",
	boardBackground: "#2a2a32",
	emptyTile: "#3a3a45",
	textLight: "#e8e4df",
	textDark: "#1a1a1e",
	text: "#e8e4df",
	unknownTile: "#6b6b78",
	textScale: 3,
	luminanceThreshold: 0.45,
	movementSpeed: 50,
	tiles: {
		2: "#4a4a55",
		4: "#5c5348",
		8: "#c47a3a",
		16: "#d48a3a",
		32: "#e06a4a",
		64: "#d44528",
		128: "#d4b84a",
		256: "#c9a82e",
		512: "#bf9e3a",
		1024: "#b8942a",
		2048: "#a88818",
		4096: "#2e9a5c",
		8192: "#6a8a28",
		16384: "#2a3a2e",
		32768: "#6a5a6a",
		65536: "#2a7a9a",
		131072: "#4a0a5a",
		262144: "#5a1a18",
		524288: "#044a6a",
		1048576: "#8a8a5a",
		2097152: "#3a6a4a",
	},
};

/** @type {Theme} */
export const lightTheme = {
	id: "light",
	name: "Light",
	pro: false,
	primary: "#4a90d9",
	secondary: "#a8c5a0",
	background: "#ffffff",
	boardBackground: "#dce3ea",
	emptyTile: "#eef2f6",
	textLight: "#4a5560",
	textDark: "#ffffff",
	text: "#2d3740",
	unknownTile: "#8899aa",
	textScale: 3,
	luminanceThreshold: 0.65,
	movementSpeed: 50,
	tiles: {
		2: "#f7f9fc",
		4: "#e8eef5",
		8: "#7eb3e8",
		16: "#5a9ad9",
		32: "#4a85c8",
		64: "#3a70b7",
		128: "#6ec4a8",
		256: "#4aaf8e",
		512: "#3a9a7a",
		1024: "#2a8568",
		2048: "#1a7056",
		4096: "#e8a05a",
		8192: "#d4883a",
		16384: "#3E5641",
		32768: "#AD9BAA",
		65536: "#5BC0EB",
		131072: "#540D6E",
		262144: "#7B2D26",
		524288: "#065A82",
		1048576: "#F4F7BE",
		2097152: "#63A375",
	},
};

/** @type {Theme} */
export const highContrastTheme = {
	id: "high-contrast",
	name: "High Contrast",
	pro: true,
	primary: "#ffcc00",
	secondary: "#00e5ff",
	background: "#000000",
	boardBackground: "#111111",
	emptyTile: "#222222",
	textLight: "#ffffff",
	textDark: "#000000",
	text: "#ffffff",
	unknownTile: "#888888",
	textScale: 3,
	luminanceThreshold: 0.5,
	movementSpeed: 50,
	tiles: {
		2: "#ffffff",
		4: "#eeeeee",
		8: "#ffcc00",
		16: "#ff9900",
		32: "#ff6600",
		64: "#ff3300",
		128: "#00e5ff",
		256: "#00b8ff",
		512: "#0088ff",
		1024: "#0055ff",
		2048: "#00ff88",
		4096: "#88ff00",
		8192: "#ccff00",
		16384: "#ff00aa",
		32768: "#aa00ff",
		65536: "#ff00ff",
		131072: "#ffff00",
		262144: "#00ffff",
		524288: "#ff0088",
		1048576: "#88ffff",
		2097152: "#ffff88",
	},
};

/** Soft / muted palette — Pro exclusive */
/** @type {Theme} */
export const softTheme = {
	id: "soft",
	name: "Soft",
	pro: true,
	primary: "#a67c6d",
	secondary: "#9aab9a",
	background: "#e8e4df",
	boardBackground: "#c4b8ae",
	emptyTile: "#d4cbc3",
	textLight: "#5c534c",
	textDark: "#f5f2ee",
	text: "#5c534c",
	unknownTile: "#8a8078",
	textScale: 3,
	luminanceThreshold: 0.65,
	movementSpeed: 50,
	tiles: {
		2: "#f0ebe6",
		4: "#e4dbd2",
		8: "#d4a890",
		16: "#c49078",
		32: "#b47860",
		64: "#a06050",
		128: "#b8c4a0",
		256: "#a0b088",
		512: "#889c70",
		1024: "#708858",
		2048: "#587440",
		4096: "#90a8b8",
		8192: "#7890a0",
		16384: "#607888",
		32768: "#b8a0b0",
		65536: "#8898a8",
		131072: "#706080",
		262144: "#886060",
		524288: "#507088",
		1048576: "#c8c8a8",
		2097152: "#708870",
	},
};

/** Playful teal / coral alternate — Pro exclusive */
/** @type {Theme} */
export const coralTheme = {
	id: "coral",
	name: "Coral",
	pro: true,
	primary: "#ff6b6b",
	secondary: "#4ecdc4",
	background: "#fff5f0",
	boardBackground: "#e8a090",
	emptyTile: "#f0c8bc",
	textLight: "#5a4038",
	textDark: "#fff8f5",
	text: "#5a4038",
	unknownTile: "#8a6860",
	textScale: 3,
	luminanceThreshold: 0.6,
	movementSpeed: 50,
	tiles: {
		2: "#fff0eb",
		4: "#ffe0d6",
		8: "#ff8a7a",
		16: "#ff6b6b",
		32: "#ee5a5a",
		64: "#dd4848",
		128: "#5ed4cc",
		256: "#4ecdc4",
		512: "#3eb8b0",
		1024: "#2ea39c",
		2048: "#1e8e88",
		4096: "#ffb347",
		8192: "#ffa02e",
		16384: "#3E5641",
		32768: "#AD9BAA",
		65536: "#5BC0EB",
		131072: "#540D6E",
		262144: "#7B2D26",
		524288: "#065A82",
		1048576: "#F4F7BE",
		2097152: "#63A375",
	},
};

/** @type {Record<string, Theme>} */
export const themes = {
	classic: classicTheme,
	dark: darkTheme,
	light: lightTheme,
	"high-contrast": highContrastTheme,
	soft: softTheme,
	coral: coralTheme,
};

export const DEFAULT_THEME_ID = "classic";

/** @deprecated Prefer classicTheme / getTheme(); kept for existing imports */
export const defaultTheme = classicTheme;

/**
 * @param {string | null | undefined} id
 * @returns {Theme}
 */
export function getTheme(id) {
	if (id && id in themes) {
		return themes[id];
	}
	return classicTheme;
}

/**
 * @returns {Theme[]}
 */
export function listThemes() {
	return Object.values(themes);
}

/**
 * Resolve a theme the user is allowed to use.
 * Falls back to Classic if the id is missing, unknown, or Pro-locked.
 * @param {string | null | undefined} id
 * @param {boolean} [isPro]
 * @returns {Theme}
 */
export function resolveTheme(id, isPro = false) {
	const theme = getTheme(id);
	if (theme.pro && !isPro) {
		return classicTheme;
	}
	return theme;
}
