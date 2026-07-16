/**
 * Challenge types, evaluation, and deterministic daily generation.
 * Daily challenges resolve in America/Chicago (CST/CDT).
 */

import { createSeededRng } from "$lib/rng.js";

export const CHALLENGE_TYPES = {
	TIME: "time",
	RECOVERY: "recovery",
};

export const CHALLENGE_RUN_STATUS = {
	IN_PROGRESS: "in_progress",
	WON: "won",
	LOST: "lost",
	ABANDONED: "abandoned",
};

/** IANA zone for daily challenge rollover (midnight Central Time) */
export const CHALLENGE_TIMEZONE = "America/Chicago";

/**
 * @typedef {Object} TimeChallengeParams
 * @property {number} [seed]
 * @property {number[][]} [board]
 * @property {number} targetScore
 * @property {number} durationSec
 */

/**
 * @typedef {Object} RecoveryChallengeParams
 * @property {number} [seed]
 * @property {number[][]} board
 * @property {number} [winTile]
 */

/**
 * @typedef {Object} ChallengeDefinition
 * @property {string} id
 * @property {typeof CHALLENGE_TYPES[keyof typeof CHALLENGE_TYPES]} type
 * @property {string} title
 * @property {string} description
 * @property {string} difficulty
 * @property {TimeChallengeParams | RecoveryChallengeParams} params
 */

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const TIME_TITLES = ["Score Sprint", "Point Rush", "Clock Race", "Quick Score"];
const RECOVERY_TITLES = ["Near Miss", "Comeback", "High Wire", "Last Stand"];

/**
 * Format a Date as YYYY-MM-DD in the challenge timezone.
 * @param {Date} [date]
 * @returns {string}
 */
export function getChallengeDateString(date = new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: CHALLENGE_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

/**
 * Parse YYYY-MM-DD into calendar parts.
 * @param {string} dateStr
 * @returns {{ year: number; month: number; day: number } | null}
 */
export function parseChallengeDate(dateStr) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
	return { year, month, day };
}

/**
 * Build daily challenge id from a date string.
 * @param {string} dateStr YYYY-MM-DD
 */
export function dailyChallengeId(dateStr) {
	return `daily-${dateStr}`;
}

/**
 * Extract YYYY-MM-DD from a daily challenge id.
 * @param {string} id
 * @returns {string | null}
 */
export function dateFromChallengeId(id) {
	if (id.startsWith("daily-")) {
		const dateStr = id.slice("daily-".length);
		return parseChallengeDate(dateStr) ? dateStr : null;
	}
	return parseChallengeDate(id) ? id : null;
}

/**
 * Compare two YYYY-MM-DD strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareDateStrings(a, b) {
	return a.localeCompare(b);
}

/**
 * Hash a string into a uint32 seed.
 * @param {string} input
 */
function hashSeed(input) {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/**
 * Create an empty 4x4 board.
 * @returns {number[][]}
 */
function emptyBoard() {
	return Array.from({ length: 4 }, () => Array(4).fill(0));
}

/**
 * Place values onto random empty cells.
 * @param {ReturnType<typeof createSeededRng>} rng
 * @param {number[]} values
 * @returns {number[][]}
 */
function boardFromValues(rng, values) {
	const board = emptyBoard();
	const positions = [];
	for (let r = 0; r < 4; r++) {
		for (let c = 0; c < 4; c++) {
			positions.push({ r, c });
		}
	}
	for (let i = positions.length - 1; i > 0; i--) {
		const j = rng.nextInt(i + 1);
		const tmp = positions[i];
		positions[i] = positions[j];
		positions[j] = tmp;
	}
	for (let i = 0; i < values.length && i < positions.length; i++) {
		const { r, c } = positions[i];
		board[r][c] = values[i];
	}
	return board;
}

/**
 * @param {ReturnType<typeof createSeededRng>} rng
 * @param {number} count
 * @param {number[]} pool
 */
function pickValues(rng, count, pool) {
	/** @type {number[]} */
	const values = [];
	for (let i = 0; i < count; i++) {
		values.push(pool[rng.nextInt(pool.length)]);
	}
	return values;
}

/**
 * Deterministically generate a daily challenge definition for a Central-Time date.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {ChallengeDefinition}
 */
export function generateDailyChallengeDefinition(dateStr) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) {
		throw new Error(`Invalid challenge date: ${dateStr}`);
	}

	const id = dailyChallengeId(dateStr);
	const seed = hashSeed(`play4096-daily-${dateStr}`);
	const rng = createSeededRng(seed);

	const typeRoll = rng.nextInt(2);
	const difficulty = DIFFICULTIES[rng.nextInt(DIFFICULTIES.length)];

	if (typeRoll === 0) {
		const durationOptions =
			difficulty === "Easy" ? [90, 75] : difficulty === "Medium" ? [60, 50] : [45, 40];
		const scoreOptions =
			difficulty === "Easy"
				? [300, 400, 500]
				: difficulty === "Medium"
					? [600, 800, 1000]
					: [1200, 1500, 2000];
		const durationSec = durationOptions[rng.nextInt(durationOptions.length)];
		const targetScore = scoreOptions[rng.nextInt(scoreOptions.length)];
		const title = TIME_TITLES[rng.nextInt(TIME_TITLES.length)];

		return {
			id,
			type: CHALLENGE_TYPES.TIME,
			title,
			description: formatChallengeOverview({
				type: CHALLENGE_TYPES.TIME,
				params: { targetScore, durationSec },
			}),
			difficulty,
			params: {
				seed,
				targetScore,
				durationSec,
			},
		};
	}

	const winTile = difficulty === "Easy" ? 512 : difficulty === "Medium" ? 1024 : 2048;
	const highValues =
		difficulty === "Easy"
			? [256, 128, 64, 32, 16, 8, 4, 2]
			: difficulty === "Medium"
				? [512, 256, 128, 64, 32, 16, 8, 4]
				: [1024, 512, 256, 128, 64, 32, 16, 8];
	const extras = pickValues(rng, 2 + rng.nextInt(3), [2, 4, 8, 16]);
	const board = boardFromValues(rng, [...highValues.slice(0, 6 + rng.nextInt(3)), ...extras]);
	const title = RECOVERY_TITLES[rng.nextInt(RECOVERY_TITLES.length)];

	return {
		id,
		type: CHALLENGE_TYPES.RECOVERY,
		title,
		description: formatChallengeOverview({
			type: CHALLENGE_TYPES.RECOVERY,
			params: { winTile, board },
		}),
		difficulty,
		params: {
			seed,
			winTile,
			board,
		},
	};
}

/**
 * Count occupied (non-zero) cells on a board.
 * @param {number[][]} board
 */
export function countFilledCells(board) {
	let count = 0;
	for (const row of board) {
		for (const cell of row) {
			if (cell !== 0) count += 1;
		}
	}
	return count;
}

/**
 * Evaluate whether a challenge run has succeeded or failed.
 *
 * @param {ChallengeDefinition} challenge
 * @param {{
 *   board: number[][];
 *   score: number;
 *   gameOver: boolean;
 *   won: boolean;
 *   elapsedMs?: number;
 * }} state
 * @returns {'won' | 'lost' | 'ongoing'}
 */
export function evaluateChallenge(challenge, state) {
	const { type, params } = challenge;

	if (type === CHALLENGE_TYPES.TIME) {
		const { targetScore, durationSec } = /** @type {TimeChallengeParams} */ (params);
		const elapsedMs = state.elapsedMs ?? 0;
		if (state.score >= targetScore) return "won";
		if (elapsedMs >= durationSec * 1000) return "lost";
		if (state.gameOver) return "lost";
		return "ongoing";
	}

	if (type === CHALLENGE_TYPES.RECOVERY) {
		const { winTile = 4096 } = /** @type {RecoveryChallengeParams} */ (params);
		const hasWinTile = state.board.some((row) => row.some((cell) => cell >= winTile));
		if (state.won || hasWinTile) return "won";
		if (state.gameOver) return "lost";
		return "ongoing";
	}

	return "ongoing";
}

/**
 * Short goal line for HUD / calendar (no fail-rule noise).
 * @param {Pick<ChallengeDefinition, 'type' | 'params'> & { description?: string }} challenge
 */
export function formatChallengeObjective(challenge) {
	const { type, params } = challenge;

	if (type === CHALLENGE_TYPES.TIME) {
		const p = /** @type {TimeChallengeParams} */ (params);
		return `Score ${p.targetScore.toLocaleString()} as fast as you can (${p.durationSec}s limit)`;
	}

	if (type === CHALLENGE_TYPES.RECOVERY) {
		const p = /** @type {RecoveryChallengeParams} */ (params);
		return `Reach ${p.winTile ?? 4096} in fewest moves`;
	}

	return challenge.description ?? "";
}

/**
 * One-line goal + rules overview for the pregame screen.
 * @param {Pick<ChallengeDefinition, 'type' | 'params'> & { description?: string }} challenge
 */
export function formatChallengeOverview(challenge) {
	const { type, params } = challenge;

	if (type === CHALLENGE_TYPES.TIME) {
		const p = /** @type {TimeChallengeParams} */ (params);
		return `Score ${p.targetScore.toLocaleString()} as fast as you can within ${p.durationSec}s. Faster clears rank higher. Timeout or game over fails.`;
	}

	if (type === CHALLENGE_TYPES.RECOVERY) {
		const p = /** @type {RecoveryChallengeParams} */ (params);
		return `Reach ${p.winTile ?? 4096} in fewest moves. Game over fails.`;
	}

	return challenge.description ?? "";
}

/**
 * Format a challenge completion time for leaderboards and stats.
 * @param {number | null | undefined} ms
 * @returns {string}
 */
export function formatChallengeElapsedMs(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
	const totalSec = ms / 1000;
	if (totalSec < 60) {
		return `${totalSec.toFixed(1)}s`;
	}
	const minutes = Math.floor(totalSec / 60);
	const seconds = totalSec - minutes * 60;
	return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

/**
 * Format a daily-challenge leaderboard / rank metric for display.
 * @param {typeof CHALLENGE_TYPES[keyof typeof CHALLENGE_TYPES]} type
 * @param {number | null | undefined} value elapsed ms (time) or move count (recovery)
 */
export function formatChallengeRankValue(type, value) {
	if (type === CHALLENGE_TYPES.TIME) {
		return formatChallengeElapsedMs(value);
	}
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	return value.toLocaleString();
}

/**
 * Short label for challenge type (pregame / calendar meta).
 * @param {typeof CHALLENGE_TYPES[keyof typeof CHALLENGE_TYPES]} type
 */
export function formatChallengeTypeLabel(type) {
	if (type === CHALLENGE_TYPES.TIME) return "Time";
	if (type === CHALLENGE_TYPES.RECOVERY) return "Recovery";
	return type;
}

/**
 * Days in a calendar month (1-indexed month).
 * @param {number} year
 * @param {number} month
 */
export function daysInMonth(year, month) {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Weekday of the 1st of the month in CST (0=Sun … 6=Sat).
 * Uses noon UTC on that calendar day as a stable anchor.
 * @param {number} year
 * @param {number} month
 */
export function weekdayOfMonthStart(year, month) {
	const dateStr = `${year}-${String(month).padStart(2, "0")}-01`;
	// Format weekday in Challenge TZ for that civil date at midday UTC
	const probe = new Date(`${dateStr}T18:00:00.000Z`);
	const weekday = new Intl.DateTimeFormat("en-US", {
		timeZone: CHALLENGE_TIMEZONE,
		weekday: "short",
	}).format(probe);
	const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
	return map[/** @type {keyof typeof map} */ (weekday)] ?? 0;
}
