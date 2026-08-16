import { getChallenges } from "@/api/challenges";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import {
  buildChallengeCalendar,
  CHALLENGE_RUN_STATUS,
  formatChallengeObjective,
  formatChallengeTypeLabel,
  parseChallengeDate
} from "@/game/challenges";
import { monthKey, shiftMonth } from "@/lib/format";
import { getInkColor } from "@/theme/themes";
import { useThemeStore } from "@/stores/theme";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ChallengesScreen() {
  const theme = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [month, setMonth] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useQuery({
    queryKey: ["challenges", month],
    queryFn: () => getChallenges(month)
  });

  const calendar = useMemo(() => {
    if (!data) return null;
    const parsed = parseChallengeDate(`${(month || data.month || data.today).slice(0, 7)}-01`);
    if (!parsed) return null;
    return buildChallengeCalendar({
      year: parsed.year,
      month: parsed.month,
      today: data.today,
      isPro: data.isPro,
      dayStatuses: data.dayStatuses
    });
  }, [data, month]);

  const todayCardBg = theme.challengeToday ?? theme.boardBackground;
  const todayInk = getInkColor(todayCardBg, theme);
  const boardInk = getInkColor(theme.boardBackground, theme);
  const todayParsed = data ? parseChallengeDate(data.today) : null;

  const goMonth = (delta: number) => {
    if (!calendar) return;
    const next = shiftMonth(calendar.year, calendar.month, delta);
    const key = monthKey(next.year, next.month);
    const todayKey = todayParsed ? monthKey(todayParsed.year, todayParsed.month) : key;
    if (delta > 0 && key > todayKey) return;
    setMonth(key);
  };

  const dayBackground = (status: string | null, isToday: boolean) => {
    if (status === CHALLENGE_RUN_STATUS.WON) return theme.challengeWon ?? "#059669";
    if (status === CHALLENGE_RUN_STATUS.LOST) return theme.challengeLost ?? "#9f1239";
    if (isToday) return theme.primary;
    return theme.boardBackground;
  };

  return (
    <Screen title="Daily Challenges" subtitle="A fresh challenge every midnight Central Time.">
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: theme.destructive ?? theme.primary }}>Could not load challenges.</Text> : null}

      {data?.todayChallenge ? (
        <View style={[styles.today, { backgroundColor: todayCardBg }]}>
          <Text style={[styles.kicker, { color: todayInk }]}>Today · {data.today}</Text>
          <Text style={[styles.todayTitle, { color: todayInk }]}>{data.todayChallenge.title}</Text>
          <Text style={[styles.todayMeta, { color: todayInk }]}>
            {formatChallengeTypeLabel(data.todayChallenge.type)} · {data.todayChallenge.difficulty}
          </Text>
          <Text style={[styles.todayBody, { color: todayInk }]}>{formatChallengeObjective(data.todayChallenge)}</Text>
          <Link href={`/(app)/challenge/${data.todayChallenge.id}`} asChild>
            <Button>{data.isPro ? "Play today's challenge" : "View today's challenge"}</Button>
          </Link>
        </View>
      ) : null}

      {data && !data.isPro ? (
        <View style={[styles.upsell, { backgroundColor: theme.boardBackground }]}>
          <Text style={[styles.upsellText, { color: boardInk }]}>
            Browse today’s challenge below. Starting any challenge — and opening past days — requires Pro.
          </Text>
          <Link href="/(app)/pro" asChild>
            <Button>Upgrade to Pro</Button>
          </Link>
        </View>
      ) : null}

      {calendar ? (
        <View>
          <View style={styles.monthRow}>
            <Pressable accessibilityLabel="Previous month" onPress={() => goMonth(-1)} style={styles.monthBtn}>
              <Icon name="chevronLeft" color={theme.text ?? theme.textLight} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text ?? theme.textLight }]}>{calendar.monthLabel}</Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => goMonth(1)}
              disabled={Boolean(todayParsed && monthKey(calendar.year, calendar.month) >= monthKey(todayParsed.year, todayParsed.month))}
              style={styles.monthBtn}
            >
              <Icon name="chevronRight" color={theme.text ?? theme.textLight} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((label, i) => (
              <Text key={`${label}-${i}`} style={[styles.weekday, { color: theme.textLight }]}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: calendar.startWeekday }, (_, i) => (
              <View key={`blank-${i}`} style={styles.day} />
            ))}
            {calendar.days.map((day) => {
              if (day.isFuture) {
                return (
                  <View key={day.dateStr} style={[styles.day, styles.dayInner]}>
                    <Text style={{ color: theme.textLight, opacity: 0.5 }}>{day.day}</Text>
                  </View>
                );
              }
              const bg = day.locked ? theme.boardBackground : dayBackground(day.status, day.isToday);
              const ink = getInkColor(bg, theme);
              return (
                <Pressable
                  key={day.dateStr}
                  accessibilityLabel={`${day.dateStr}${day.isToday ? ", today" : ""}`}
                  onPress={() => router.push(day.locked ? "/(app)/pro" : `/(app)/challenge/${day.id}`)}
                  style={[
                    styles.day,
                    styles.dayInner,
                    { backgroundColor: bg },
                    day.isToday ? { borderWidth: 2, borderColor: theme.primary } : null
                  ]}
                >
                  <Text style={{ color: ink, fontWeight: "700" }}>{day.day}</Text>
                  {day.locked ? <Icon name="crown" size={11} color={ink} /> : null}
                  {day.status === CHALLENGE_RUN_STATUS.WON ? <Icon name="check" size={11} color={ink} /> : null}
                  {day.status === CHALLENGE_RUN_STATUS.LOST ? <Icon name="close" size={11} color={ink} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  today: { borderRadius: 16, padding: 16, gap: 8 },
  kicker: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", opacity: 0.75 },
  todayTitle: { fontSize: 22, fontWeight: "900" },
  todayMeta: { fontSize: 13, opacity: 0.85 },
  todayBody: { fontSize: 14, marginBottom: 4 },
  upsell: { borderRadius: 12, padding: 16, gap: 10, alignItems: "center" },
  upsellText: { textAlign: "center", fontSize: 14 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  monthBtn: { padding: 8 },
  monthLabel: { fontSize: 18, fontWeight: "800" },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.285%", aspectRatio: 1, padding: 2 },
  dayInner: { borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 1 }
});
