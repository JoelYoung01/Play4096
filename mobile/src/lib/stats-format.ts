export function formatStatNumber(value: number | null | undefined, fallback = "—") {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value.toLocaleString();
}

export function formatRecord(wins: number | null | undefined, losses: number | null | undefined) {
  return `${typeof wins === "number" ? wins : 0}–${typeof losses === "number" ? losses : 0}`;
}

export function historyStatusLabel(entry: { status?: string; won?: boolean; complete?: boolean }) {
  if (entry.status === "active" || entry.complete === false) return "ACTIVE";
  return entry.won ? "WIN" : "LOSS";
}

export function formatHistoryDate(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
