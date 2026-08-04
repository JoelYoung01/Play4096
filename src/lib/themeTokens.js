/**
 * Map play4096 theme presets onto shadcn semantic tokens + game tokens.
 * @typedef {import('$lib/assets/themes.js').Theme} Theme
 */
import { contrastRatio, getInkColor, relativeLuminance } from "./assets/themes.js";

/**
 * @param {string} hex
 * @param {number} [amount]
 * @returns {string}
 */
export function darkenColor(hex, amount = 0.2) {
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
	const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
	const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));
	return `#${darkenedR.toString(16).padStart(2, "0")}${darkenedG.toString(16).padStart(2, "0")}${darkenedB.toString(16).padStart(2, "0")}`;
}

/**
 * @param {string} hex
 * @param {number} [amount]
 * @returns {string}
 */
export function lightenColor(hex, amount = 0.2) {
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const lightenedR = Math.min(255, Math.floor(r + (255 - r) * amount));
	const lightenedG = Math.min(255, Math.floor(g + (255 - g) * amount));
	const lightenedB = Math.min(255, Math.floor(b + (255 - b) * amount));
	return `#${lightenedR.toString(16).padStart(2, "0")}${lightenedG.toString(16).padStart(2, "0")}${lightenedB.toString(16).padStart(2, "0")}`;
}

/**
 * Whether a theme is dark-surfaced (drives elevation + toast styling).
 * @param {Theme} theme
 * @returns {boolean}
 */
export function isDarkTheme(theme) {
	return relativeLuminance(theme.background) < 0.45;
}

/**
 * Pick whichever theme ink (textLight vs textDark) reads better on a surface.
 * Unlike getInkColor this never uses Classic's historical threshold — chrome
 * accents like primary are midtones where only the max-contrast ink works.
 * @param {string} bg
 * @param {Theme} theme
 * @returns {string}
 */
function pickInk(bg, theme) {
	return contrastRatio(bg, theme.textLight) >= contrastRatio(bg, theme.textDark)
		? theme.textLight
		: theme.textDark;
}

/**
 * Apply theme CSS variables to an element (typically document.documentElement).
 * @param {CSSStyleDeclaration} style
 * @param {Theme} theme
 */
export function applyThemeTokens(style, theme) {
	const dark = isDarkTheme(theme);
	const foreground = theme.text ?? pickInk(theme.background, theme);
	const primaryFg = pickInk(theme.primary, theme);
	// Some secondaries are midtones where neither ink clears AA — themes
	// provide an explicit ink for those.
	const secondaryFg = theme.secondaryForeground ?? pickInk(theme.secondary, theme);
	const muted = theme.emptyTile;
	const border = theme.border ?? theme.emptyTile;
	// Closer surfaces are lighter (in both light and dark themes). Dark themes
	// get smaller lifts so raised surfaces stay within a narrow brightness
	// band of the page — they also rely on this instead of drop shadows.
	const card = dark ? lightenColor(theme.background, 0.035) : theme.background;
	const popover = lightenColor(theme.background, dark ? 0.06 : 0.15);

	// shadcn chrome tokens
	style.setProperty("--background", theme.background);
	style.setProperty("--foreground", foreground);
	style.setProperty("--card", card);
	style.setProperty("--card-foreground", foreground);
	style.setProperty("--popover", popover);
	style.setProperty("--popover-foreground", foreground);
	style.setProperty("--primary", theme.primary);
	style.setProperty("--primary-foreground", primaryFg);
	style.setProperty("--secondary", theme.secondary);
	style.setProperty("--secondary-foreground", secondaryFg);
	style.setProperty("--muted", muted);
	style.setProperty("--muted-foreground", pickInk(theme.emptyTile, theme));
	style.setProperty("--accent", theme.boardBackground);
	style.setProperty("--accent-foreground", getInkColor(theme.boardBackground, theme));
	style.setProperty("--destructive", theme.destructive ?? "#e95937");
	style.setProperty("--border", border);
	style.setProperty("--input", border);
	style.setProperty("--ring", theme.primary);

	style.setProperty("--sidebar", theme.background);
	style.setProperty("--sidebar-foreground", foreground);
	style.setProperty("--sidebar-primary", theme.primary);
	style.setProperty("--sidebar-primary-foreground", primaryFg);
	style.setProperty("--sidebar-accent", muted);
	style.setProperty("--sidebar-accent-foreground", foreground);
	style.setProperty("--sidebar-border", border);
	style.setProperty("--sidebar-ring", theme.primary);

	style.setProperty("--chart-1", theme.primary);
	style.setProperty("--chart-2", theme.secondary);
	style.setProperty("--chart-3", theme.tiles?.[8] ?? theme.primary);
	style.setProperty("--chart-4", theme.tiles?.[4096] ?? theme.secondary);
	style.setProperty("--chart-5", theme.boardBackground);

	// Game / board tokens
	style.setProperty("--color-board-background", theme.boardBackground);
	style.setProperty("--color-empty-tile", theme.emptyTile);
	style.setProperty("--color-text-light", theme.textLight);
	style.setProperty("--color-text-dark", theme.textDark);
	style.setProperty("--color-unknown-tile", theme.unknownTile);
	style.setProperty("--text-scale", String(theme.textScale));
	style.setProperty("--luminance-threshold", String(theme.luminanceThreshold));
	style.setProperty("--movement-speed", `${theme.movementSpeed}ms`);

	if (theme.tiles) {
		for (const [value, color] of Object.entries(theme.tiles)) {
			style.setProperty(`--color-tile-${value}`, color);
		}
	}
}
