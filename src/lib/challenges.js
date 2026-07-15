/**
 * Challenge content definitions (static for v1).
 * Three types: time, clear, recovery — see issue #5.
 */

export const CHALLENGE_TYPES = {
	TIME: "time",
	CLEAR: "clear",
	RECOVERY: "recovery",
};

export const CHALLENGE_RUN_STATUS = {
	IN_PROGRESS: "in_progress",
	WON: "won",
	LOST: "lost",
	ABANDONED: "abandoned",
};

/**
 * @typedef {Object} TimeChallengeParams
 * @property {number} [seed]
 * @property {number[][]} [board]
 * @property {number} targetScore
 * @property {number} durationSec
 */

/**
 * @typedef {Object} ClearChallengeParams
 * @property {number} [seed]
 * @property {number[][]} board
 * @property {number} [maxFilled] Success when occupied cells ≤ this
 * @property {number} [clearPercent] Success when occupied ≤ ceil(initial * (1 - percent/100))
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
 * @property {TimeChallengeParams | ClearChallengeParams | RecoveryChallengeParams} params
 */

/** @type {ChallengeDefinition[]} */
export const CHALLENGES = [
	{
		id: "sprint-500",
		type: CHALLENGE_TYPES.TIME,
		title: "Score Sprint",
		description: "Reach 500 points before the clock hits zero. Starts from a fresh board.",
		difficulty: "Easy",
		params: {
			seed: 2048,
			targetScore: 500,
			durationSec: 60,
		},
	},
	{
		id: "space-maker",
		type: CHALLENGE_TYPES.CLEAR,
		title: "Space Maker",
		description: "This board is packed. Merge until 4 or fewer tiles remain.",
		difficulty: "Medium",
		params: {
			seed: 4096,
			board: [
				[2, 2, 4, 4],
				[8, 8, 16, 16],
				[2, 2, 4, 4],
				[8, 8, 0, 0],
			],
			maxFilled: 4,
		},
	},
	{
		id: "near-miss",
		type: CHALLENGE_TYPES.RECOVERY,
		title: "Near Miss",
		description: "Pull off a 2048 from this awkward high-tile scramble.",
		difficulty: "Hard",
		params: {
			seed: 1024,
			winTile: 2048,
			board: [
				[1024, 512, 256, 128],
				[4, 8, 16, 32],
				[2, 64, 0, 0],
				[0, 0, 0, 0],
			],
		},
	},
];

/**
 * @param {string} id
 * @returns {ChallengeDefinition | undefined}
 */
export function getChallengeById(id) {
	return CHALLENGES.find((c) => c.id === id);
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
 * Resolve the clear-board filled-cell target from challenge params.
 * @param {ClearChallengeParams} params
 */
export function resolveClearTarget(params) {
	const initialFilled = countFilledCells(params.board);
	if (typeof params.maxFilled === "number") {
		return params.maxFilled;
	}
	if (typeof params.clearPercent === "number") {
		return Math.ceil(initialFilled * (1 - params.clearPercent / 100));
	}
	return 0;
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

	if (type === CHALLENGE_TYPES.CLEAR) {
		const clearParams = /** @type {ClearChallengeParams} */ (params);
		const target = resolveClearTarget(clearParams);
		if (countFilledCells(state.board) <= target) return "won";
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
 * Human-readable objective line for UI.
 * @param {ChallengeDefinition} challenge
 */
export function formatChallengeObjective(challenge) {
	const { type, params } = challenge;

	if (type === CHALLENGE_TYPES.TIME) {
		const p = /** @type {TimeChallengeParams} */ (params);
		return `Score ${p.targetScore.toLocaleString()} in ${p.durationSec}s`;
	}

	if (type === CHALLENGE_TYPES.CLEAR) {
		const p = /** @type {ClearChallengeParams} */ (params);
		const target = resolveClearTarget(p);
		return `Reduce to ${target} or fewer tiles`;
	}

	if (type === CHALLENGE_TYPES.RECOVERY) {
		const p = /** @type {RecoveryChallengeParams} */ (params);
		return `Reach ${p.winTile ?? 4096}`;
	}

	return challenge.description;
}
