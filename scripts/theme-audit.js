/**
 * Theme palette audit — run after editing src/lib/assets/themes.js:
 *
 *   node scripts/theme-audit.js
 *
 * Checks every theme against the palette conventions documented in themes.js:
 *
 * - No pure #000/#fff in chrome colors (near-black / near-white only).
 *   Tile ramps and the unknown-tile fallback are game content and exempt.
 * - Important elements reach WCAG AA (4.5:1): body text, button fills under
 *   their picked ink, secondary surfaces, destructive/error text, muted text.
 * - `primary` holds ≥ 3:1 as heading text on the page background.
 * - Board-colored HUD surfaces (score boxes etc.) hold ≥ 4.2:1 under the ink
 *   getInkColor picks. Classic is exempt: its light-on-brown score box is the
 *   historical 2048 look, kept deliberately.
 * - Reports (non-fatal): HSB ladder of surfaces, neutral tint/temperature,
 *   container brightness deltas, worst tile ink per theme.
 *
 * Exits 1 when a hard check fails.
 */
import { contrastRatio, getInkColor, listThemes } from "../src/lib/assets/themes.js";
import { applyThemeTokens } from "../src/lib/themeTokens.js";

/** @param {string} hex */
function hsb(hex) {
	const h = hex.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16));
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let hue = 0;
	if (d !== 0) {
		if (max === r) hue = 60 * (((g - b) / d + 6) % 6);
		else if (max === g) hue = 60 * ((b - r) / d + 2);
		else hue = 60 * ((r - g) / d + 4);
	}
	return {
		h: Math.round(hue),
		s: max === 0 ? 0 : Math.round((d / max) * 100),
		b: Math.round((max / 255) * 100),
	};
}

/** Fake CSSStyleDeclaration that records what applyThemeTokens computes. */
function computeTokens(theme) {
	const store = new Map();
	applyThemeTokens({ setProperty: (k, v) => store.set(k, v) }, theme);
	return store;
}

const CHROME_FIELDS = [
	"background",
	"boardBackground",
	"emptyTile",
	"border",
	"primary",
	"secondary",
	"secondaryForeground",
	"destructive",
	"text",
	"textLight",
	"textDark",
];

let failures = 0;

/** @param {boolean} ok */
function check(ok, label, detail) {
	if (!ok) failures++;
	console.log(`  ${ok ? " ok " : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

const r2 = (x) => Math.round(x * 100) / 100;

for (const theme of listThemes()) {
	const tokens = computeTokens(theme);
	console.log(`\n=== ${theme.name} (${theme.id}) ===`);

	// Surface ladder report
	for (const key of ["background", "boardBackground", "emptyTile", "primary", "secondary"]) {
		const { h, s, b } = hsb(theme[key]);
		console.log(`       ${key.padEnd(16)} ${theme[key]}  H${h}° S${s}% B${b}%`);
	}
	const dBoard = Math.abs(hsb(theme.boardBackground).b - hsb(theme.background).b);
	const dEmpty = Math.abs(hsb(theme.emptyTile).b - hsb(theme.boardBackground).b);
	console.log(`       brightness steps: page→board ${dBoard}%, board→empty ${dEmpty}%`);

	// Pure-value ban (chrome only; tiles are game content)
	for (const key of CHROME_FIELDS) {
		const value = theme[key];
		if (!value) continue;
		const v = value.toLowerCase();
		check(
			v !== "#000000" && v !== "#ffffff" && v !== "#000" && v !== "#fff",
			`${key} is not pure black/white`,
			value
		);
	}

	// Contrast gates for important elements (WCAG AA)
	const fg = tokens.get("--foreground");
	const primaryFg = tokens.get("--primary-foreground");
	const secondaryFg = tokens.get("--secondary-foreground");
	const mutedFg = tokens.get("--muted-foreground");
	const destructive = tokens.get("--destructive");

	check(
		contrastRatio(fg, theme.background) >= 4.5,
		"body text on page ≥ 4.5",
		r2(contrastRatio(fg, theme.background))
	);
	check(
		contrastRatio(primaryFg, theme.primary) >= 4.5,
		"button ink on primary ≥ 4.5",
		r2(contrastRatio(primaryFg, theme.primary))
	);
	check(
		contrastRatio(theme.primary, theme.background) >= 3,
		"primary as heading text ≥ 3",
		r2(contrastRatio(theme.primary, theme.background))
	);
	check(
		contrastRatio(secondaryFg, theme.secondary) >= 4.5,
		"ink on secondary ≥ 4.5",
		r2(contrastRatio(secondaryFg, theme.secondary))
	);
	check(
		contrastRatio(destructive, theme.background) >= 4.5,
		"destructive text on page ≥ 4.5",
		r2(contrastRatio(destructive, theme.background))
	);
	check(
		contrastRatio(mutedFg, theme.background) >= 4.5,
		"muted text on page ≥ 4.5",
		r2(contrastRatio(mutedFg, theme.background))
	);

	const boardInk = getInkColor(theme.boardBackground, theme);
	const boardInkRatio = contrastRatio(boardInk, theme.boardBackground);
	if (theme.id === "classic") {
		console.log(
			`   --   HUD ink on board = ${r2(boardInkRatio)} (historical light-on-brown, exempt)`
		);
	} else {
		check(boardInkRatio >= 4.2, "HUD ink on board ≥ 4.2", r2(boardInkRatio));
	}

	// Tile ink report (classic keeps its historical threshold ink)
	let worst = Infinity;
	let worstTile = null;
	for (const [value, tile] of Object.entries(theme.tiles)) {
		const ratio = contrastRatio(tile, getInkColor(tile, theme));
		if (ratio < worst) {
			worst = ratio;
			worstTile = value;
		}
	}
	console.log(
		`   --   worst tile ink: ${worstTile} → ${r2(worst)}${theme.id === "classic" ? " (historical, exempt)" : ""}`
	);
}

console.log(failures === 0 ? "\nAll theme checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
