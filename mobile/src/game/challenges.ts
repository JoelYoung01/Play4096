import type { ChallengeDefinition } from "@/types";
import { createSeededRng } from "./rng";

export const CHALLENGE_TYPES = { TIME: "time", RECOVERY: "recovery" } as const;
export const CHALLENGE_RUN_STATUS = { IN_PROGRESS: "in_progress", WON: "won", LOST: "lost", ABANDONED: "abandoned" } as const;
export const CHALLENGE_TIMEZONE = "America/Chicago";
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TIME_TITLES = ["Score Sprint", "Point Rush", "Clock Race", "Quick Score"];
const RECOVERY_TITLES = ["Near Miss", "Comeback", "High Wire", "Last Stand"];
export const getChallengeDateString = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: CHALLENGE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export function parseChallengeDate(dateStr: string) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr); if (!m) return null; const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]); return Number.isFinite(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { year, month, day } : null; }
export const dailyChallengeId = (dateStr: string) => `daily-${dateStr}`;
export const dateFromChallengeId = (id: string) => id.startsWith("daily-") ? (parseChallengeDate(id.slice(6)) ? id.slice(6) : null) : (parseChallengeDate(id) ? id : null);
function hashSeed(input: string) { let h = 2166136261; for (let i = 0; i < input.length; i += 1) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function boardFromValues(rng: ReturnType<typeof createSeededRng>, values: number[]) { const board = Array.from({ length: 4 }, () => Array(4).fill(0)); const positions = Array.from({ length: 16 }, (_, i) => ({ r: Math.floor(i / 4), c: i % 4 })); for (let i = positions.length - 1; i > 0; i -= 1) { const j = rng.nextInt(i + 1); [positions[i], positions[j]] = [positions[j], positions[i]]; } values.slice(0, positions.length).forEach((value, i) => { const p = positions[i]; board[p.r][p.c] = value; }); return board; }
const pickValues = (rng: ReturnType<typeof createSeededRng>, count: number, pool: number[]) => Array.from({ length: count }, () => pool[rng.nextInt(pool.length)]);
export function generateDailyChallengeDefinition(dateStr: string): ChallengeDefinition { if (!parseChallengeDate(dateStr)) throw new Error(`Invalid challenge date: ${dateStr}`); const id = dailyChallengeId(dateStr), seed = hashSeed(`play4096-daily-${dateStr}`), rng = createSeededRng(seed), difficulty = DIFFICULTIES[rng.nextInt(DIFFICULTIES.length)]; if (rng.nextInt(2) === 0) { const durationOptions = difficulty === "Easy" ? [90, 75] : difficulty === "Medium" ? [60, 50] : [45, 40], scoreOptions = difficulty === "Easy" ? [300, 400, 500] : difficulty === "Medium" ? [600, 800, 1000] : [1200, 1500, 2000]; const durationSec = durationOptions[rng.nextInt(durationOptions.length)], targetScore = scoreOptions[rng.nextInt(scoreOptions.length)]; return { id, type: CHALLENGE_TYPES.TIME, title: TIME_TITLES[rng.nextInt(TIME_TITLES.length)], description: `Score ${targetScore.toLocaleString()} within ${durationSec}s.`, difficulty, params: { seed, targetScore, durationSec } }; } const winTile = difficulty === "Easy" ? 512 : difficulty === "Medium" ? 1024 : 2048; const highValues = difficulty === "Easy" ? [256, 128, 64, 32, 16, 8, 4, 2] : difficulty === "Medium" ? [512, 256, 128, 64, 32, 16, 8, 4] : [1024, 512, 256, 128, 64, 32, 16, 8]; const board = boardFromValues(rng, [...highValues.slice(0, 6 + rng.nextInt(3)), ...pickValues(rng, 2 + rng.nextInt(3), [2, 4, 8, 16])]); return { id, type: CHALLENGE_TYPES.RECOVERY, title: RECOVERY_TITLES[rng.nextInt(RECOVERY_TITLES.length)], description: `Reach ${winTile} in fewest moves.`, difficulty, params: { seed, winTile, board } }; }
export function evaluateChallenge(challenge: ChallengeDefinition, state: { board: number[][]; score: number; gameOver: boolean; won: boolean; elapsedMs?: number }) { if (challenge.type === CHALLENGE_TYPES.TIME) { const targetScore = Number(challenge.params.targetScore ?? 0), durationSec = Number(challenge.params.durationSec ?? 0); if (state.score >= targetScore) return "won"; if ((state.elapsedMs ?? 0) >= durationSec * 1000 || state.gameOver) return "lost"; return "ongoing"; } const winTile = Number(challenge.params.winTile ?? 4096); if (state.won || state.board.some((row) => row.some((cell) => cell >= winTile))) return "won"; return state.gameOver ? "lost" : "ongoing"; }
export const formatChallengeObjective = (challenge: ChallengeDefinition) => {
  if (challenge.type === CHALLENGE_TYPES.TIME) {
    return `Score ${Number(challenge.params.targetScore ?? 0).toLocaleString()} as fast as you can (${Number(challenge.params.durationSec ?? 0)}s limit)`;
  }
  return `Reach ${Number(challenge.params.winTile ?? 4096)} in fewest moves`;
};

export const formatChallengeOverview = (challenge: ChallengeDefinition) => {
  if (challenge.type === CHALLENGE_TYPES.TIME) {
    return `Score ${Number(challenge.params.targetScore ?? 0).toLocaleString()} as fast as you can within ${Number(challenge.params.durationSec ?? 0)}s. Faster clears rank higher. Timeout or game over fails.`;
  }
  if (challenge.type === CHALLENGE_TYPES.RECOVERY) {
    return `Reach ${Number(challenge.params.winTile ?? 4096)} in fewest moves. Game over fails.`;
  }
  return challenge.description ?? "";
};

export function formatChallengeElapsedMs(ms: number | null | undefined) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

export function formatChallengeRankValue(type: string, value: number | null | undefined) {
  if (type === CHALLENGE_TYPES.TIME) return formatChallengeElapsedMs(value);
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString();
}

export function formatChallengeTypeLabel(type: string) {
  if (type === CHALLENGE_TYPES.TIME) return "Time";
  if (type === CHALLENGE_TYPES.RECOVERY) return "Recovery";
  return type;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function weekdayOfMonthStart(year: number, month: number) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const probe = new Date(`${dateStr}T18:00:00.000Z`);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: CHALLENGE_TIMEZONE, weekday: "short" }).format(probe);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

export function countFilledCells(board: number[][]) {
  return board.reduce((sum, row) => sum + row.filter((cell) => cell !== 0).length, 0);
}

export function challengeCompleteScore(challenge: ChallengeDefinition, state: { score: number; moveCount: number; elapsedMs: number }) {
  if (challenge.type === CHALLENGE_TYPES.RECOVERY) return state.moveCount;
  if (challenge.type === CHALLENGE_TYPES.TIME) return state.elapsedMs;
  return state.score;
}

export type CalendarDay = {
  day: number;
  dateStr: string;
  id: string;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  status: string | null;
  locked: boolean;
};

export function buildChallengeCalendar(opts: {
  year: number;
  month: number;
  today: string;
  isPro: boolean;
  dayStatuses?: Record<string, string> | null;
}) {
  const { year, month, today, isPro, dayStatuses } = opts;
  const dim = daysInMonth(year, month);
  const startWeekday = weekdayOfMonthStart(year, month);
  const days: CalendarDay[] = [];
  for (let day = 1; day <= dim; day += 1) {
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
      status: dayStatuses?.[dateStr] ?? null,
      locked: isPast && !isPro
    });
  }
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: CHALLENGE_TIMEZONE,
    month: "long",
    year: "numeric"
  }).format(new Date(`${year}-${String(month).padStart(2, "0")}-15T18:00:00.000Z`));
  return { year, month, monthLabel, startWeekday, days };
}
