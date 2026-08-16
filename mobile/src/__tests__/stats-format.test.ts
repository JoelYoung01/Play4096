import { formatHistoryDate, formatRecord, formatStatNumber, historyStatusLabel } from "@/lib/stats-format";

describe("stats format helpers", () => {
  it("formats numbers and records", () => {
    expect(formatStatNumber(4096)).toBe("4,096");
    expect(formatStatNumber(null)).toBe("—");
    expect(formatRecord(3, 2)).toBe("3–2");
    expect(formatRecord(undefined, undefined)).toBe("0–0");
  });

  it("labels history rows like the web list", () => {
    expect(historyStatusLabel({ status: "active" })).toBe("ACTIVE");
    expect(historyStatusLabel({ status: "finished", won: true })).toBe("WIN");
    expect(historyStatusLabel({ status: "finished", won: false })).toBe("LOSS");
  });

  it("formats history timestamps", () => {
    expect(formatHistoryDate(null)).toBe("—");
    expect(formatHistoryDate("not-a-date")).toBe("—");
    expect(formatHistoryDate("2026-08-16T18:00:00.000Z")).toMatch(/2026/);
  });
});
