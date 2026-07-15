import { USER_LEVELS } from "$lib/constants.js";
import {
	CHALLENGE_TIMEZONE,
	dailyChallengeId,
	daysInMonth,
	formatChallengeObjective,
	getChallengeDateString,
	parseChallengeDate,
	weekdayOfMonthStart,
} from "$lib/challenges.js";
import { ensureDailyChallenge, getChallengeDayStatuses } from "$lib/server/challenge.js";
import { getUserProfile } from "$lib/server/user.js";

/** @type {import("./$types").PageServerLoad} */
export async function load({ locals, url }) {
	const today = getChallengeDateString();
	const todayParsed = parseChallengeDate(today);

	const monthParam = url.searchParams.get("month");
	let year = todayParsed?.year ?? new Date().getFullYear();
	let month = todayParsed?.month ?? new Date().getMonth() + 1;

	if (monthParam) {
		const m = parseChallengeDate(`${monthParam}-01`);
		if (m) {
			year = m.year;
			month = m.month;
		}
	}

	const todayChallenge = ensureDailyChallenge(today);

	let user = null;
	/** @type {Record<string, string>} */
	let dayStatuses = {};
	if (locals.user) {
		user = getUserProfile(locals.user.id);
		if (user?.level === USER_LEVELS.PRO) {
			const start = `${year}-${String(month).padStart(2, "0")}-01`;
			const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
			dayStatuses = getChallengeDayStatuses(user.id, start, end);
		}
	}

	const isPro = user?.level === USER_LEVELS.PRO;
	const dim = daysInMonth(year, month);
	const startWeekday = weekdayOfMonthStart(year, month);

	/** @type {Array<{ day: number; dateStr: string; id: string; isToday: boolean; isFuture: boolean; isPast: boolean; status: string | null; locked: boolean }>} */
	const days = [];
	for (let day = 1; day <= dim; day++) {
		const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		const isToday = dateStr === today;
		const isFuture = dateStr > today;
		const isPast = dateStr < today;
		days.push({
			day,
			dateStr,
			id: dailyChallengeId(dateStr),
			isToday,
			isFuture,
			isPast,
			status: dayStatuses[dateStr] ?? null,
			locked: isPast && !isPro,
		});
	}

	const monthLabel = new Intl.DateTimeFormat("en-US", {
		timeZone: CHALLENGE_TIMEZONE,
		month: "long",
		year: "numeric",
	}).format(new Date(`${year}-${String(month).padStart(2, "0")}-15T18:00:00.000Z`));

	const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
	const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
	const nextMonthStr = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`;
	const canGoNext =
		nextMonthStr <= `${todayParsed?.year}-${String(todayParsed?.month).padStart(2, "0")}`;

	return {
		user,
		isPro,
		today,
		timezone: CHALLENGE_TIMEZONE,
		todayChallenge: {
			...todayChallenge,
			objective: formatChallengeObjective(todayChallenge),
			dateStr: today,
		},
		calendar: {
			year,
			month,
			monthLabel,
			startWeekday,
			days,
			prevHref: `/challenges?month=${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`,
			nextHref: canGoNext ? `/challenges?month=${nextMonthStr}` : null,
		},
	};
}
