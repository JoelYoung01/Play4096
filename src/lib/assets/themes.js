/**
 * Color theme presets.
 *
 * Palette conventions (checked by `node scripts/theme-audit.js`):
 * - Chrome neutrals are near-black / near-white — never pure #000/#fff — and
 *   carry a low-saturation tint of the theme's accent. Each theme commits to
 *   one temperature (warm or cool) for its neutrals; mixing both breaks
 *   coherence. Tile ramps are game content and are exempt.
 * - Chrome surfaces sit on distinct brightness steps (page → board well →
 *   empty cells), keeping container deltas inside ~12% (dark UIs) / ~7%
 *   (light UIs) HSB brightness.
 * - Important elements get high contrast: `primary` and `destructive` are
 *   tuned to ≥ 4.5:1 (WCAG AA) both as text on `background` and under their
 *   picked ink; structural elements (borders, empty cells) stay low-contrast.
 * - Dark themes set `shadows: false` — drop shadows don't read on dark
 *   backgrounds, so elevation comes from lighter surfaces instead.
 *
 * @typedef {Object} Theme
 * @property {string} id
 * @property {string} name
 * @property {boolean} [pro]
 * @property {string} primary
 * @property {string} secondary
 * @property {string} background
 * @property {string} boardBackground
 * @property {string} emptyTile
 * @property {string} textLight Dark ink, used on light surfaces/tiles
 * @property {string} textDark Light ink, used on dark surfaces/tiles
 * @property {string} [text]
 * @property {string} unknownTile
 * @property {string} [secondaryForeground] Explicit ink for secondary surfaces when neither text ink reaches AA contrast
 * @property {string} [border] Border/input color when `emptyTile` sits too close to `background` to read as an edge
 * @property {string} [destructive] Error/danger accent tuned for AA contrast against `background`
 * @property {boolean} [shadows] false = flat depth (dark UIs); drop shadows are suppressed app-wide
 * @property {number} textScale
 * @property {number} luminanceThreshold
 * @property {number} movementSpeed
 * @property {Record<number, string>} tiles
 * Calendar day fills for cleared / failed runs. Cleared days use a success
 * green; per-theme hues stay distinct from `primary` (today) and
 * `challengeLost` (failed) where those accents collide (e.g. light's blue today).
 * @property {string} challengeWon
 * @property {string} challengeLost
 */

/**
 * Relative luminance of a hex color (0–1), per WCAG 2.
 * @param {string} hex
 * @returns {number}
 */
export function relativeLuminance(hex) {
	hex = hex.replace(/^#/, "");
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((x) => x + x)
			.join("");
	}
	const num = parseInt(hex, 16);
	const channels = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * WCAG contrast ratio between two hex colors.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function contrastRatio(a, b) {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Readable ink (textLight vs textDark) for a theme-colored surface.
 * Classic keeps its historical luminance-threshold pick — light ink on the
 * board browns is part of the original 2048 look — while every other theme
 * picks whichever ink has the higher WCAG contrast.
 * @param {string} bg
 * @param {Theme} theme
 * @returns {string}
 */
export function getInkColor(bg, theme) {
	if (theme.id === "classic") {
		return relativeLuminance(bg) < theme.luminanceThreshold ? theme.textDark : theme.textLight;
	}
	return contrastRatio(bg, theme.textLight) >= contrastRatio(bg, theme.textDark)
		? theme.textLight
		: theme.textDark;
}

/** Classic tile ramp — preserved byte-for-byte; do not retune. */
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
	8192: "#2E8B57",
	16384: "#3E5641",
	32768: "#AD9BAA",
	65536: "#5BC0EB",
	131072: "#540D6E",
	262144: "#7B2D26",
	524288: "#065A82",
	1048576: "#F4F7BE",
	2097152: "#63A375",
};

/**
 * The historical 2048 look. Tiles, board browns and inks are untouched; the
 * warm neutrals (hue ≈ 30°, ~5% saturation on the page) already follow the
 * palette conventions. Only the accents were retuned: primary and destructive
 * deepened from their bright originals so buttons and headings clear AA, and
 * secondary gets an explicit deep-sage ink (both theme inks are midtone-weak
 * on the sage pill).
 * @type {Theme}
 */
export const classicTheme = {
	id: "classic",
	name: "Classic",
	pro: false,
	// Deepened from #e88f4f: 4.6:1 as heading text on the cream page and
	// 4.5:1 under its near-white ink as a button fill (was ~2.3:1).
	primary: "#b8541a",
	secondary: "#C2D4B0",
	secondaryForeground: "#3e5641",
	background: "#fbf8ef",
	boardBackground: "#bbada0",
	emptyTile: "#cdc1b4",
	textLight: "#776e65",
	textDark: "#f9f6f2",
	text: "#776e65",
	unknownTile: "#5f5f5f",
	// Deepened from the tile-64 red #e95937 (3.3:1) for AA error text.
	destructive: "#c93d20",
	shadows: true,
	textScale: 3,
	luminanceThreshold: 0.7,
	movementSpeed: 50,
	// Emerald success green — clear "cleared" signal vs orange today / rose failed
	challengeWon: "#059669",
	challengeLost: "#9f1239",
	tiles: { ...classicTiles },
};

/**
 * Warm near-black. Neutrals re-tinted from blue-grey toward the orange
 * accent — cool neutrals under a warm accent (and a warm tile ramp) mixed
 * temperatures. Surfaces climb ~7% brightness per step (page 11% → board
 * 18% → empty cells 24%), inside the ≤12% container band for dark UIs.
 * Flat depth: elevation reads through lighter surfaces, not shadows.
 * @type {Theme}
 */
export const darkTheme = {
	id: "dark",
	name: "Dark",
	pro: false,
	primary: "#e88f4f",
	secondary: "#3d5a45",
	background: "#1c1a18",
	boardBackground: "#2d2a26",
	emptyTile: "#3e3a34",
	textLight: "#1c1a18",
	textDark: "#e8e4df",
	text: "#e8e4df",
	unknownTile: "#6b6b78",
	// Brighter than the shared red so error text holds ~5.5:1 on near-black.
	destructive: "#f2643f",
	shadows: false,
	textScale: 3,
	luminanceThreshold: 0.45,
	movementSpeed: 50,
	// Brighter emerald so cleared days pop on the warm near-black page
	challengeWon: "#34d399",
	challengeLost: "#e11d48",
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

/**
 * Cool, airy counterpart to Classic. The page is a near-white saturated ~2%
 * toward the blue accent (pure #ffffff was too harsh), which also brings the
 * board well inside the ≤7% brightness band. Primary deepened to hold white
 * button text at AA, and `border` steps a shade past the empty-cell tone so
 * container edges contrast with both the fill and the page.
 * @type {Theme}
 */
export const lightTheme = {
	id: "light",
	name: "Light",
	pro: false,
	// Deepened from #4a90d9 (3.1:1) to 4.6:1 under near-white button text.
	primary: "#2f74c0",
	secondary: "#a8c5a0",
	secondaryForeground: "#2b4226",
	background: "#f7fafc",
	boardBackground: "#dce3ea",
	emptyTile: "#eef2f6",
	border: "#c9d3dc",
	textLight: "#4a5560",
	textDark: "#f9fcfe",
	text: "#2d3740",
	unknownTile: "#8899aa",
	destructive: "#c22f2f",
	shadows: true,
	textScale: 3,
	luminanceThreshold: 0.65,
	movementSpeed: 50,
	// Emerald cleared stays distinct from blue today and rose failed
	challengeWon: "#059669",
	challengeLost: "#9f1239",
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

/**
 * Maximum-legibility palette. Chrome swaps pure #000/#fff for warm
 * near-black / near-white — still ≈18:1 and gentler on halation — while the
 * full-saturation neon tile ramp keeps its punch. `border` is lifted well
 * clear of the background so inputs and container edges stay findable.
 * Flat depth like Dark.
 * @type {Theme}
 */
export const highContrastTheme = {
	id: "high-contrast",
	name: "High Contrast",
	pro: true,
	primary: "#ffcc00",
	secondary: "#00e5ff",
	background: "#0c0b09",
	boardBackground: "#171412",
	emptyTile: "#262220",
	border: "#4a443c",
	textLight: "#0c0b09",
	textDark: "#f8f6f1",
	text: "#f8f6f1",
	unknownTile: "#888888",
	destructive: "#ff4d42",
	shadows: false,
	textScale: 3,
	luminanceThreshold: 0.5,
	movementSpeed: 50,
	// Neon success green (matches tile-2048) vs yellow today / magenta failed
	challengeWon: "#00ff88",
	challengeLost: "#ff0066",
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

/**
 * Muted warm greys — Pro exclusive. Ink and the clay primary deepened so
 * text and buttons clear AA against the deliberately low-contrast surfaces
 * without losing the hushed look; secondary gets an explicit deep-green ink.
 * @type {Theme}
 */
export const softTheme = {
	id: "soft",
	name: "Soft",
	pro: true,
	// Deepened from #a67c6d (3.2:1 under ink) to 5.4:1 / 4.8:1 on the page.
	primary: "#7e5a4c",
	secondary: "#9aab9a",
	secondaryForeground: "#2a3428",
	background: "#e8e4df",
	boardBackground: "#c4b8ae",
	emptyTile: "#d4cbc3",
	textLight: "#52493f",
	textDark: "#f5f2ee",
	text: "#52493f",
	unknownTile: "#8a8078",
	destructive: "#a83a1e",
	shadows: true,
	textScale: 3,
	luminanceThreshold: 0.65,
	movementSpeed: 50,
	challengeWon: "#059669",
	challengeLost: "#9f1239",
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

/**
 * Playful teal / coral alternate — Pro exclusive. Background eased off full
 * brightness with a <5% coral tint, and primary deepened from the tile coral
 * to a red that holds near-white button text at AA (the tiles keep the
 * bright coral).
 * @type {Theme}
 */
export const coralTheme = {
	id: "coral",
	name: "Coral",
	pro: true,
	// Deepened from #ff6b6b (2.7:1 under ink) to 5.1:1 / 4.9:1 on the page.
	primary: "#c73333",
	secondary: "#4ecdc4",
	background: "#fbf3ef",
	boardBackground: "#e8a090",
	emptyTile: "#f0c8bc",
	textLight: "#5a4038",
	textDark: "#fff8f5",
	text: "#5a4038",
	unknownTile: "#8a6860",
	destructive: "#c93d20",
	shadows: true,
	textScale: 3,
	luminanceThreshold: 0.6,
	movementSpeed: 50,
	// Emerald cleared vs coral today; purple lost stays off the coral primary
	challengeWon: "#059669",
	challengeLost: "#7e22ce",
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
