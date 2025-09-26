/**
 * @typedef {{ count: number, refilledAt: number }} RefillBucket
 */

/**
 * @typedef {{ count: number, createdAt: number }} ExpiringBucket
 */

/**
 * @typedef {{ timeout: number, updatedAt: number }} ThrottlingCounter
 */

/**
 * @template _Key
 */
export class RefillingTokenBucket {
	/** @type {number} */
	max;
	/** @type {number} */
	refillIntervalSeconds;

	/**
	 * @param {number} max
	 * @param {number} refillIntervalSeconds
	 */
	constructor(max, refillIntervalSeconds) {
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
	}

	/** @type {Map<_Key, RefillBucket>} */
	storage = new Map();

	/**
	 * @param {_Key} key
	 * @param {number} cost
	 * @returns {boolean}
	 */
	check(key, cost) {
		const bucket = this.storage.get(key) ?? null;
		if (bucket === null) {
			return true;
		}
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			return Math.min(bucket.count + refill, this.max) >= cost;
		}
		return bucket.count >= cost;
	}

	/**
	 * @param {_Key} key
	 * @param {number} cost
	 * @returns {boolean}
	 */
	consume(key, cost) {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				refilledAt: now,
			};
			this.storage.set(key, bucket);
			return true;
		}
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		bucket.count = Math.min(bucket.count + refill, this.max);
		bucket.refilledAt = now;
		if (bucket.count < cost) {
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}
}

/**
 * @template _Key
 */
export class Throttler {
	/** @type {number[]} */
	timeoutSeconds;

	/** @type {Map<_Key, ThrottlingCounter>} */
	storage = new Map();

	/**
	 * @param {number[]} timeoutSeconds
	 */
	constructor(timeoutSeconds) {
		this.timeoutSeconds = timeoutSeconds;
	}

	/**
	 * @param {_Key} key
	 * @returns {boolean}
	 */
	consume(key) {
		let counter = this.storage.get(key) ?? null;
		const now = Date.now();
		if (counter === null) {
			counter = {
				timeout: 0,
				updatedAt: now,
			};
			this.storage.set(key, counter);
			return true;
		}
		const allowed = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;
		if (!allowed) {
			return false;
		}
		counter.updatedAt = now;
		counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
		this.storage.set(key, counter);
		return true;
	}

	/**
	 * @param {_Key} key
	 * @returns {void}
	 */
	reset(key) {
		this.storage.delete(key);
	}
}

/**
 * @template _Key
 */
export class ExpiringTokenBucket {
	/** @type {number} */
	max;
	/** @type {number} */
	expiresInSeconds;

	/** @type {Map<_Key, ExpiringBucket>} */
	storage = new Map();

	/**
	 * @param {number} max
	 * @param {number} expiresInSeconds
	 */
	constructor(max, expiresInSeconds) {
		this.max = max;
		this.expiresInSeconds = expiresInSeconds;
	}

	/**
	 * @param {_Key} key
	 * @param {number} cost
	 * @returns {boolean}
	 */
	check(key, cost) {
		const bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			return true;
		}
		return bucket.count >= cost;
	}

	/**
	 * @param {_Key} key
	 * @param {number} cost
	 * @returns {boolean}
	 */
	consume(key, cost) {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				createdAt: now,
			};
			this.storage.set(key, bucket);
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			bucket.count = this.max;
		}
		if (bucket.count < cost) {
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}

	/**
	 * @param {_Key} key
	 * @returns {void}
	 */
	reset(key) {
		this.storage.delete(key);
	}
}
