/**
 * Classic score leaderboard period helpers.
 * Uses America/Chicago civil dates so classic and challenge boards share a calendar.
 */

import { CHALLENGE_TIMEZONE, getChallengeDateString, parseChallengeDate } from "$lib/challenges.js";

export const LEADERBOARD_PERIODS = /** @type {const} */ ({
	DAILY: "daily",
	WEEKLY: "weekly",
	MONTHLY: "monthly",
});

/**
 * @typedef {typeof LEADERBOARD_PERIODS[keyof typeof LEADERBOARD_PERIODS]} LeaderboardPeriod
 */

/**
 * Shift a YYYY-MM-DD civil date by a number of days.
 * @param {string} dateStr
 * @param {number} deltaDays
 * @returns {string | null}
 */
export function shiftCivilDate(dateStr, deltaDays) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) return null;
	const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + deltaDays));
	return utc.toISOString().slice(0, 10);
}

/**
 * Format zoned date parts for an instant.
 * @param {Date} date
 * @param {string} [timeZone]
 */
function formatZonedParts(date, timeZone = CHALLENGE_TIMEZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);

	/** @type {Record<string, string>} */
	const map = {};
	for (const part of parts) {
		if (part.type !== "literal") map[part.type] = part.value;
	}
	return {
		year: Number(map.year),
		month: Number(map.month),
		day: Number(map.day),
		hour: Number(map.hour),
		minute: Number(map.minute),
		second: Number(map.second),
	};
}

/**
 * UTC instant for midnight (00:00:00) on a civil date in the given time zone.
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} [timeZone]
 * @returns {Date}
 */
export function zonedMidnight(dateStr, timeZone = CHALLENGE_TIMEZONE) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) throw new Error(`Invalid date: ${dateStr}`);

	// Start near UTC midnight for that label, then correct toward local midnight.
	let guess = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0);
	for (let i = 0; i < 4; i++) {
		const parts = formatZonedParts(new Date(guess), timeZone);
		const asUtc = Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second
		);
		const desired = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0);
		guess += desired - asUtc;
	}
	return new Date(guess);
}

/**
 * Exclusive end bound for a half-open [start, end) civil-day range.
 * @param {string} startDate YYYY-MM-DD inclusive
 * @param {string} endDateExclusive YYYY-MM-DD exclusive
 */
export function civilDateRangeBounds(startDate, endDateExclusive) {
	return {
		start: zonedMidnight(startDate),
		end: zonedMidnight(endDateExclusive),
	};
}

/**
 * Monday-start week containing a civil date.
 * @param {string} dateStr
 * @returns {{ startDate: string; endDateExclusive: string }}
 */
export function weekRangeContaining(dateStr) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) throw new Error(`Invalid date: ${dateStr}`);

	// Civil weekday via UTC noon anchor (stable for labeled calendar dates).
	const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12)).getUTCDay();
	const daysFromMonday = (weekday + 6) % 7;
	const startDate = shiftCivilDate(dateStr, -daysFromMonday);
	const endDateExclusive = shiftCivilDate(startDate, 7);
	if (!startDate || !endDateExclusive) throw new Error(`Invalid week for ${dateStr}`);
	return { startDate, endDateExclusive };
}

/**
 * Calendar month containing a civil date.
 * @param {string} dateStr
 * @returns {{ startDate: string; endDateExclusive: string }}
 */
export function monthRangeContaining(dateStr) {
	const parsed = parseChallengeDate(dateStr);
	if (!parsed) throw new Error(`Invalid date: ${dateStr}`);

	const startDate = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-01`;
	const nextMonth = parsed.month === 12 ? 1 : parsed.month + 1;
	const nextYear = parsed.month === 12 ? parsed.year + 1 : parsed.year;
	const endDateExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
	return { startDate, endDateExclusive };
}

/**
 * Resolve bounds + nav anchors for a classic score period.
 * @param {LeaderboardPeriod} period
 * @param {string} [anchorDate] YYYY-MM-DD (defaults to today in Chicago)
 */
export function getClassicPeriodWindow(period, anchorDate = getChallengeDateString()) {
	const today = getChallengeDateString();
	let dateStr = parseChallengeDate(anchorDate) ? anchorDate : today;
	if (dateStr > today) dateStr = today;

	if (period === LEADERBOARD_PERIODS.DAILY) {
		const endDateExclusive = shiftCivilDate(dateStr, 1);
		if (!endDateExclusive) throw new Error(`Invalid daily window for ${dateStr}`);
		const nextCandidate = shiftCivilDate(dateStr, 1);

		return {
			period,
			anchorDate: dateStr,
			startDate: dateStr,
			endDateExclusive,
			...civilDateRangeBounds(dateStr, endDateExclusive),
			prevAnchor: shiftCivilDate(dateStr, -1),
			nextAnchor: nextCandidate && nextCandidate <= today ? nextCandidate : null,
			isCurrent: dateStr === today,
		};
	}

	if (period === LEADERBOARD_PERIODS.WEEKLY) {
		const { startDate, endDateExclusive } = weekRangeContaining(dateStr);
		const currentWeek = weekRangeContaining(today);
		const nextWeekStart = endDateExclusive;

		return {
			period,
			anchorDate: startDate,
			startDate,
			endDateExclusive,
			...civilDateRangeBounds(startDate, endDateExclusive),
			prevAnchor: shiftCivilDate(startDate, -7),
			nextAnchor: nextWeekStart <= currentWeek.startDate ? nextWeekStart : null,
			isCurrent: startDate === currentWeek.startDate,
		};
	}

	if (period === LEADERBOARD_PERIODS.MONTHLY) {
		const { startDate, endDateExclusive } = monthRangeContaining(dateStr);
		const currentMonth = monthRangeContaining(today);
		const parsed = parseChallengeDate(startDate);
		if (!parsed) throw new Error(`Invalid month start ${startDate}`);
		const prevMonth = parsed.month === 1 ? 12 : parsed.month - 1;
		const prevYear = parsed.month === 1 ? parsed.year - 1 : parsed.year;
		const prevAnchor = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;

		return {
			period,
			anchorDate: startDate,
			startDate,
			endDateExclusive,
			...civilDateRangeBounds(startDate, endDateExclusive),
			prevAnchor,
			nextAnchor: startDate < currentMonth.startDate ? endDateExclusive : null,
			isCurrent: startDate === currentMonth.startDate,
		};
	}

	throw new Error(`Unknown leaderboard period: ${period}`);
}

/**
 * Human-readable range for period headers.
 * @param {{ startDate: string; endDateExclusive: string; period: LeaderboardPeriod; isCurrent: boolean }} window
 */
export function formatPeriodRangeLabel(window) {
	/**
	 * @param {string} dateStr
	 * @param {Intl.DateTimeFormatOptions} [opts]
	 */
	function fmt(dateStr, opts = { month: "short", day: "numeric" }) {
		const [y, m, d] = dateStr.split("-").map(Number);
		return new Date(Date.UTC(y, m - 1, d, 18)).toLocaleDateString(undefined, {
			...opts,
			timeZone: "UTC",
		});
	}

	if (window.period === LEADERBOARD_PERIODS.DAILY) {
		const prefix = window.isCurrent ? "Today · " : "";
		return (
			prefix +
			fmt(window.startDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
		);
	}

	const lastDay = shiftCivilDate(window.endDateExclusive, -1);
	if (!lastDay) return fmt(window.startDate);

	if (window.period === LEADERBOARD_PERIODS.MONTHLY) {
		const [y, m] = window.startDate.split("-").map(Number);
		const monthLabel = new Date(Date.UTC(y, m - 1, 1, 18)).toLocaleDateString(undefined, {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		});
		return window.isCurrent ? `This month · ${monthLabel}` : monthLabel;
	}

	const startLabel = fmt(window.startDate, { month: "short", day: "numeric" });
	const endLabel = fmt(lastDay, { month: "short", day: "numeric", year: "numeric" });
	const range = `${startLabel} – ${endLabel}`;
	return window.isCurrent ? `This week · ${range}` : range;
}
