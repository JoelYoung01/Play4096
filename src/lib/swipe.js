import { DIRECTIONS } from "$lib/constants.js";

/**
 * Create touch swipe handlers that map gestures to DIRECTIONS.
 * @param {(direction: number) => void} onMove
 * @param {number} [threshold]
 */
export function createSwipeHandlers(onMove, threshold = 5) {
	let touchStartX = 0;
	let touchStartY = 0;

	/**
	 * @param {TouchEvent} event
	 */
	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	/**
	 * @param {TouchEvent} event
	 */
	function handleTouchEnd(event) {
		if (!touchStartX || !touchStartY) return;

		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;

		const diffX = touchStartX - touchEndX;
		const diffY = touchStartY - touchEndY;

		if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) return;

		event.preventDefault();
		event.stopPropagation();

		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0) onMove(DIRECTIONS.LEFT);
			else onMove(DIRECTIONS.RIGHT);
		} else {
			if (diffY > 0) onMove(DIRECTIONS.UP);
			else onMove(DIRECTIONS.DOWN);
		}

		touchStartX = 0;
		touchStartY = 0;
	}

	/**
	 * @param {TouchEvent} event
	 */
	function handleTouchMove(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	return { handleTouchStart, handleTouchEnd, handleTouchMove };
}
