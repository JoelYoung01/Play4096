/**
 * Mulberry32 — small, fast, deterministic PRNG.
 * @param {number} seed
 * @returns {{ next: () => number, nextInt: (max: number) => number, state: number }}
 */
export function createSeededRng(seed) {
	let state = seed >>> 0;

	return {
		get state() {
			return state;
		},
		set state(value) {
			state = value >>> 0;
		},
		/**
		 * @returns {number} Float in [0, 1)
		 */
		next() {
			state = (state + 0x6d2b79f5) >>> 0;
			let t = state;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		},
		/**
		 * @param {number} max Exclusive upper bound
		 * @returns {number} Integer in [0, max)
		 */
		nextInt(max) {
			return Math.floor(this.next() * max);
		},
	};
}

/**
 * Generate a fresh game seed from crypto when available.
 * @returns {number}
 */
export function generateSeed() {
	if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
		const buf = new Uint32Array(1);
		crypto.getRandomValues(buf);
		return buf[0] >>> 0;
	}
	return (Math.random() * 0xffffffff) >>> 0;
}
