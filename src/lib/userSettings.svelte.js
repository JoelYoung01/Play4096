import { browser } from "$app/environment";
import { DEFAULT_TILE_ANIMATION_SPEED, LOCAL_STORAGE_USER_SETTINGS } from "./constants.js";
import { clampTileAnimationSpeed } from "./animationSpeed.js";

/**
 * @typedef {{ tileAnimationSpeed: number }} UserSettings
 */

/** @type {UserSettings} */
const defaultSettings = {
	tileAnimationSpeed: DEFAULT_TILE_ANIMATION_SPEED,
};

/**
 * @returns {UserSettings}
 */
function loadSettings() {
	if (!browser) return { ...defaultSettings };

	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_USER_SETTINGS);
		if (!raw) return { ...defaultSettings };

		const parsed = JSON.parse(raw);
		return {
			tileAnimationSpeed: clampTileAnimationSpeed(
				parsed.tileAnimationSpeed ?? DEFAULT_TILE_ANIMATION_SPEED
			),
		};
	} catch {
		return { ...defaultSettings };
	}
}

/**
 * @param {UserSettings} settings
 */
function persistSettings(settings) {
	if (!browser) return;
	localStorage.setItem(LOCAL_STORAGE_USER_SETTINGS, JSON.stringify(settings));
}

export const userSettings = $state(loadSettings());

/**
 * @param {number} speed
 */
export function setTileAnimationSpeed(speed) {
	userSettings.tileAnimationSpeed = clampTileAnimationSpeed(speed);
	persistSettings(userSettings);
}
