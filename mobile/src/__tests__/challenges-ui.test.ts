import {
  buildChallengeCalendar,
  challengeCompleteScore,
  CHALLENGE_TYPES,
  formatChallengeTypeLabel
} from "@/game/challenges";

describe("buildChallengeCalendar", () => {
  it("marks past days locked for free players and keeps today playable", () => {
    const calendar = buildChallengeCalendar({
      year: 2026,
      month: 8,
      today: "2026-08-16",
      isPro: false,
      dayStatuses: { "2026-08-10": "won" }
    });
    expect(calendar.days).toHaveLength(31);
    const tenth = calendar.days.find((day) => day.dateStr === "2026-08-10");
    const today = calendar.days.find((day) => day.dateStr === "2026-08-16");
    const future = calendar.days.find((day) => day.dateStr === "2026-08-20");
    expect(tenth).toMatchObject({ locked: true, isPast: true, status: "won" });
    expect(today).toMatchObject({ locked: false, isToday: true });
    expect(future).toMatchObject({ isFuture: true, locked: false });
  });
});

describe("challenge helpers", () => {
  it("labels challenge types and scores a recovery run by move count", () => {
    expect(formatChallengeTypeLabel(CHALLENGE_TYPES.TIME)).toBe("Time");
    expect(
      challengeCompleteScore(
        { id: "daily-2026-08-16", type: CHALLENGE_TYPES.RECOVERY, title: "Comeback", description: "", difficulty: "Hard", params: { winTile: 1024 } },
        { score: 900, moveCount: 14, elapsedMs: 32000 }
      )
    ).toBe(14);
  });
});
