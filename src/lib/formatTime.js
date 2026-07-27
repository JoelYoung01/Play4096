/**
 * Classic win duration from created → completed (wall clock).
 * @param {number | null | undefined} ms
 * @returns {string}
 */
export function formatWinDuration(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
	const totalSec = Math.floor(ms / 1000);
	if (totalSec < 60) return `${totalSec}s`;
	const minutes = Math.floor(totalSec / 60);
	const seconds = totalSec % 60;
	if (minutes < 60) {
		return `${minutes}:${String(seconds).padStart(2, "0")}`;
	}
	const hours = Math.floor(minutes / 60);
	const remMin = minutes % 60;
	return `${hours}h ${remMin}m`;
}
