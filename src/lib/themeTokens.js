/**
 * Map play4096 theme presets onto shadcn semantic tokens + game tokens.
 * @typedef {import('$lib/assets/themes.js').Theme} Theme
 */

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
 * Relative luminance of a hex color (0–1).
 * @param {string} hex
 * @returns {number}
 */
function luminance(hex) {
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16) / 255;
	const g = parseInt(hex.substring(2, 4), 16) / 255;
	const b = parseInt(hex.substring(4, 6), 16) / 255;
	const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Pick light or dark text for contrast against a background.
 * @param {string} bg
 * @param {string} light
 * @param {string} dark
 * @returns {string}
 */
function contrastText(bg, light, dark) {
	return luminance(bg) > 0.45 ? dark : light;
}

/**
 * Apply theme CSS variables to an element (typically document.documentElement).
 * @param {CSSStyleDeclaration} style
 * @param {Theme} theme
 */
export function applyThemeTokens(style, theme) {
	const foreground = theme.text ?? theme.textLight;
	const primaryFg = contrastText(theme.primary, theme.textDark, theme.textLight);
	const secondaryFg = contrastText(theme.secondary, theme.textDark, theme.textLight);
	const muted = theme.emptyTile;
	const border = theme.emptyTile;
	const card = theme.background;
	const popover = lightenColor(theme.background, 0.15);

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
	style.setProperty("--muted-foreground", theme.textLight);
	style.setProperty("--accent", theme.boardBackground);
	style.setProperty(
		"--accent-foreground",
		contrastText(theme.boardBackground, theme.textDark, theme.textLight)
	);
	style.setProperty("--destructive", "#e95937");
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
