import { differenceInCalendarDays, format, getDaysInMonth, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Workout } from '@/types';

// Month statistics for the /stats screen. Everything is derived client-side
// from the full workout history the store already holds.
//
// Counting rules (shared by every block):
//   • a qualifying set is a strength set the user ticked off (`done === true`).
//     That predicate — not `Workout.completed`, which nothing in the app ever
//     sets to true — is what keeps future planned workouts out of the numbers;
//   • a day counts as a training day when it has at least one qualifying set —
//     bodyweight work (weightKg === 0) counts as a day but adds 0 to tonnage;
//   • several workouts on the same date are merged into one training day, the
//     same way computeExerciseStats already does it.

/** 'yyyy-MM' */
export type MonthKey = string;
/** 'yyyy-MM-dd' */
export type DateKey = string;

export interface TrainingDay {
  date: DateKey;
  tonnageKg: number; // Σ weightKg × reps over the day's qualifying sets
  sets: number;
}

export interface StrengthProgress {
  name: string;
  currentOneRm: number; // best 1RM of the last session in the month
  baselineOneRm: number | null; // null when there is nothing to compare against
  deltaKg: number | null;
  deltaPct: number | null;
  bestWeightKg: number; // the set that produced currentOneRm
  bestReps: number;
  lastDate: DateKey;
  sessions: number; // training days with this exercise inside the month
  totalSets: number;
}

export interface MuscleShare {
  group: string; // Russian label, straight from Exercise.muscleGroup
  sets: number;
  percent: number; // 0–100
}

export interface MonthStats {
  monthKey: MonthKey;
  days: TrainingDay[]; // ascending by date, training days only
  workoutCount: number;
  perWeek: number; // workoutCount / daysInMonth × 7
  totalTonnageKg: number;
  avgTonnageKg: number;
  maxTonnageKg: number;
  totalSets: number;
  strength: StrengthProgress[];
  balance: MuscleShare[]; // groups above 5%, biggest first
  isEmpty: boolean;
}

// Epley: weight × (1 + reps / 30). Bodyweight sets have no meaningful 1RM.
// Reps are clamped at 30 — uncapped Epley claims a 2.7× max off a 50-rep set,
// which would let endurance work dominate the strength ranking.
export function estimateOneRm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + Math.min(reps, 30) / 30);
}

export function monthKeyOf(date: DateKey): MonthKey {
  return date.slice(0, 7);
}

export function currentMonthKey(today: Date): MonthKey {
  return format(today, 'yyyy-MM');
}

/** shiftMonthKey('2026-01', -1) === '2025-12' */
export function shiftMonthKey(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, 'yyyy-MM');
}

/** Local Date at the 1st of the month, 00:00 — never `new Date(isoString)`. */
export function monthStartDate(key: MonthKey): Date {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, 1);
}

/** 'Август 2026' — matches the month title on the home screen. */
export function formatMonthTitle(key: MonthKey): string {
  return format(monthStartDate(key), 'LLLL yyyy', { locale: ru }).replace(/^./, (c) =>
    c.toUpperCase()
  );
}

function isTrainingWorkout(w: Workout): boolean {
  return w.exercises.some(
    (ex) => ex.kind === 'strength' && (ex.sets ?? []).some((s) => s.done)
  );
}

/** Ascending months that contain at least one qualifying set. */
export function listMonthKeysWithData(workouts: Workout[]): MonthKey[] {
  const keys = new Set<MonthKey>();
  for (const w of workouts) {
    if (isTrainingWorkout(w)) keys.add(monthKeyOf(w.date));
  }
  return Array.from(keys).sort();
}

export function computeMonthStats(workouts: Workout[], monthKey: MonthKey): MonthStats {
  const prefix = `${monthKey}-`;

  const dayMap = new Map<DateKey, { tonnageKg: number; sets: number }>();
  const groupSets = new Map<string, number>();
  // exercise name → date → best set of that session, kept for the *whole*
  // history because the baseline may pre-date the selected month.
  const sessions = new Map<
    string,
    { byDate: Map<DateKey, { oneRm: number; weightKg: number; reps: number }>; monthSets: number }
  >();
  let totalSets = 0;

  for (const w of workouts) {
    const inMonth = w.date.startsWith(prefix);

    for (const ex of w.exercises) {
      if (ex.kind !== 'strength') continue;
      const done = (ex.sets ?? []).filter((s) => s.done);
      if (done.length === 0) continue;

      let best = { oneRm: 0, weightKg: 0, reps: 0 };
      for (const s of done) {
        const oneRm = estimateOneRm(s.weightKg, s.reps);
        if (oneRm > best.oneRm) best = { oneRm, weightKg: s.weightKg, reps: s.reps };
      }

      if (best.oneRm > 0) {
        let entry = sessions.get(ex.name);
        if (!entry) {
          entry = { byDate: new Map(), monthSets: 0 };
          sessions.set(ex.name, entry);
        }
        const prev = entry.byDate.get(w.date);
        if (!prev || best.oneRm > prev.oneRm) entry.byDate.set(w.date, best);
        if (inMonth) entry.monthSets += done.length;
      }

      if (!inMonth) continue;

      const day = dayMap.get(w.date) ?? { tonnageKg: 0, sets: 0 };
      day.tonnageKg += done.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
      day.sets += done.length;
      dayMap.set(w.date, day);

      const group = ex.muscleGroup || 'Другое';
      groupSets.set(group, (groupSets.get(group) ?? 0) + done.length);
      totalSets += done.length;
    }
  }

  const days: TrainingDay[] = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, tonnageKg: d.tonnageKg, sets: d.sets }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const workoutCount = days.length;
  const totalTonnageKg = days.reduce((sum, d) => sum + d.tonnageKg, 0);
  const avgTonnageKg = workoutCount > 0 ? totalTonnageKg / workoutCount : 0;
  const maxTonnageKg = days.reduce((max, d) => Math.max(max, d.tonnageKg), 0);
  const perWeek =
    workoutCount > 0 ? (workoutCount / getDaysInMonth(monthStartDate(monthKey))) * 7 : 0;

  const strength: StrengthProgress[] = [];
  for (const [name, entry] of sessions) {
    const dates = Array.from(entry.byDate.keys()).sort();
    const monthDates = dates.filter((d) => d.startsWith(prefix));
    if (monthDates.length === 0) continue;

    const lastDate = monthDates[monthDates.length - 1];
    const current = entry.byDate.get(lastDate)!;

    // Baseline: the first session inside the month, or — when the exercise was
    // done only once this month — the most recent session before it started.
    let baselineDate: string | undefined;
    if (monthDates.length > 1) {
      baselineDate = monthDates[0];
    } else {
      const before = dates.filter((d) => d < prefix);
      baselineDate = before[before.length - 1];
    }

    const baselineOneRm = baselineDate ? entry.byDate.get(baselineDate)!.oneRm : null;
    const deltaKg = baselineOneRm !== null ? current.oneRm - baselineOneRm : null;
    const deltaPct =
      baselineOneRm !== null && baselineOneRm > 0
        ? (current.oneRm / baselineOneRm - 1) * 100
        : null;

    strength.push({
      name,
      currentOneRm: current.oneRm,
      baselineOneRm,
      deltaKg,
      deltaPct,
      bestWeightKg: current.weightKg,
      bestReps: current.reps,
      lastDate,
      sessions: monthDates.length,
      totalSets: entry.monthSets,
    });
  }

  // Biggest gains first; exercises without a baseline sink to the bottom.
  strength.sort((a, b) => {
    if (a.deltaKg === null && b.deltaKg === null) return b.currentOneRm - a.currentOneRm;
    if (a.deltaKg === null) return 1;
    if (b.deltaKg === null) return -1;
    if (b.deltaKg !== a.deltaKg) return b.deltaKg - a.deltaKg;
    return b.currentOneRm - a.currentOneRm;
  });

  const balance: MuscleShare[] = Array.from(groupSets.entries())
    .map(([group, sets]) => ({
      group,
      sets,
      percent: totalSets > 0 ? (sets / totalSets) * 100 : 0,
    }))
    .filter((g) => g.percent > 5)
    .sort((a, b) => b.percent - a.percent);

  return {
    monthKey,
    days,
    workoutCount,
    perWeek,
    totalTonnageKg,
    avgTonnageKg,
    maxTonnageKg,
    totalSets,
    strength,
    balance,
    isEmpty: workoutCount === 0,
  };
}

// date → marker colours, for the stats calendar. Only qualifying training days
// appear, so the grid can never show more dots than the footer count claims.
export function computeTrainingMarkers(workouts: Workout[]): Map<DateKey, string[]> {
  const byDate = new Map<DateKey, string[]>();
  for (const w of workouts) {
    if (!isTrainingWorkout(w)) continue;
    const color = w.emojiBg ?? w.marker ?? 'blue';
    const colors = byDate.get(w.date) ?? [];
    if (!colors.includes(color)) colors.push(color);
    byDate.set(w.date, colors);
  }
  return byDate;
}

/** The most recent workout of the month that actually has ticked-off sets. */
export function findLastTrainingWorkout(
  workouts: Workout[],
  monthKey: MonthKey
): Workout | null {
  const prefix = `${monthKey}-`;
  let latest: Workout | null = null;
  for (const w of workouts) {
    if (!w.date.startsWith(prefix) || !isTrainingWorkout(w)) continue;
    if (
      !latest ||
      w.date > latest.date ||
      (w.date === latest.date && w.startTime > latest.startTime)
    ) {
      latest = w;
    }
  }
  return latest;
}

/** Σ weightKg × reps over a workout's ticked-off strength sets. */
export function workoutTonnage(workout: Workout): number {
  return workout.exercises
    .filter((ex) => ex.kind === 'strength')
    .flatMap((ex) => (ex.sets ?? []).filter((s) => s.done))
    .reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}

// ── Monthly AI report ──────────────────────────────────────────────────────
//
// The archived monthly report needs richer, cross-month figures than the stats
// feed (records against all-time bests, streaks, month-over-month deltas). These
// helpers build on `computeMonthStats` and one extra pass over the full history,
// then ship the result to the AI report endpoint — mirroring how AiSummaryBlock
// already sends computed stats rather than raw workouts.

/** Below this a month is too thin to be worth an AI report (spec: ≥ 3). */
export const REPORT_MIN_WORKOUTS = 3;

// The normalized 5-block report the AI produces. Client-safe so both the server
// generator and the report sheet share one shape. Stored as JSON in
// AiMonthlyReport.report.
export interface MonthlyReport {
  mainConclusion: string;
  keyFigures: { label: string; value: string; note: string }[];
  whatWorked: string[];
  needsAttention: string[];
  recommendations: string[];
  forecast: string;
}

export type TonnageTrend = 'up' | 'down' | 'flat';

export interface MonthReportInput {
  monthKey: MonthKey;
  monthTitle: string;
  daysInMonth: number;
  // Regularity
  workoutCount: number;
  perWeek: number;
  longestStreak: number; // most consecutive training days
  longestGap: number; // most rest days between two training days
  // Load
  totalTonnageKg: number;
  avgTonnageKg: number;
  maxTonnageKg: number;
  minTonnageKg: number;
  tonnageTrend: TonnageTrend; // first vs last training day of the month
  totalSets: number;
  // Records (only counted against an existing all-time baseline)
  oneRmRecordCount: number;
  tonnageRecord: boolean;
  // Strength
  strengthTop: {
    name: string;
    currentOneRm: number;
    deltaKg: number | null;
    deltaPct: number | null;
  }[];
  strengthStagnant: string[]; // exercises with zero/negative 1RM progress
  // Balance
  balance: { group: string; percent: number }[];
  dominantGroup: { group: string; percent: number } | null;
  laggingGroup: { group: string; percent: number } | null;
  balanceRatio: number | null; // dominant % ÷ lagging %
  // Month-over-month
  prevWorkoutCount: number | null;
  workoutCountDelta: number | null;
  tonnageDeltaPct: number | null;
}

function computeStreakAndGap(days: TrainingDay[]): { streak: number; gap: number } {
  if (days.length === 0) return { streak: 0, gap: 0 };
  let streak = 1;
  let best = 1;
  let gap = 0;
  for (let i = 1; i < days.length; i++) {
    const diff = differenceInCalendarDays(parseISO(days[i].date), parseISO(days[i - 1].date));
    if (diff === 1) {
      streak += 1;
      if (streak > best) best = streak;
    } else {
      streak = 1;
      if (diff - 1 > gap) gap = diff - 1;
    }
  }
  return { streak: best, gap };
}

/**
 * Everything the AI needs to write a month's report. Pure — safe to run on the
 * client (where the store already holds the history) or on the server.
 */
export function computeMonthReportInput(
  workouts: Workout[],
  monthKey: MonthKey
): MonthReportInput {
  const base = computeMonthStats(workouts, monthKey);
  const prev = computeMonthStats(workouts, shiftMonthKey(monthKey, -1));
  const prefix = `${monthKey}-`;

  const { streak, gap } = computeStreakAndGap(base.days);

  const minTonnageKg =
    base.days.length > 0 ? Math.min(...base.days.map((d) => d.tonnageKg)) : 0;

  // Trend: first vs last training day of the month (5% dead-band).
  let tonnageTrend: TonnageTrend = 'flat';
  if (base.days.length >= 2) {
    const first = base.days[0].tonnageKg;
    const last = base.days[base.days.length - 1].tonnageKg;
    if (first > 0) {
      if (last > first * 1.05) tonnageTrend = 'up';
      else if (last < first * 0.95) tonnageTrend = 'down';
    }
  }

  // Records: one extra pass to find each exercise's best 1RM before the month
  // and the peak workout tonnage before the month, so month peaks can be judged
  // against an all-time baseline (not just the month itself).
  const beforeBest = new Map<string, number>();
  const monthBest = new Map<string, number>();
  let priorMaxWorkoutTonnage = 0;
  for (const w of workouts) {
    const inMonth = w.date.startsWith(prefix);
    const beforeMonth = w.date < prefix;
    if (!inMonth && !beforeMonth) continue; // future — ignore

    if (beforeMonth) {
      const t = workoutTonnage(w);
      if (t > priorMaxWorkoutTonnage) priorMaxWorkoutTonnage = t;
    }

    for (const ex of w.exercises) {
      if (ex.kind !== 'strength') continue;
      const done = (ex.sets ?? []).filter((s) => s.done);
      if (done.length === 0) continue;
      let best = 0;
      for (const s of done) best = Math.max(best, estimateOneRm(s.weightKg, s.reps));
      if (best <= 0) continue;
      const target = inMonth ? monthBest : beforeBest;
      target.set(ex.name, Math.max(target.get(ex.name) ?? 0, best));
    }
  }

  let oneRmRecordCount = 0;
  for (const [name, best] of monthBest) {
    const prior = beforeBest.get(name);
    if (prior !== undefined && best > prior + 0.01) oneRmRecordCount += 1;
  }
  const tonnageRecord = priorMaxWorkoutTonnage > 0 && base.maxTonnageKg > priorMaxWorkoutTonnage;

  const dominantGroup = base.balance[0] ?? null;
  const laggingGroup = base.balance.length > 0 ? base.balance[base.balance.length - 1] : null;
  const balanceRatio =
    dominantGroup && laggingGroup && laggingGroup.percent > 0
      ? dominantGroup.percent / laggingGroup.percent
      : null;

  const hasPrev = prev.workoutCount > 0;

  return {
    monthKey,
    monthTitle: formatMonthTitle(monthKey),
    daysInMonth: getDaysInMonth(monthStartDate(monthKey)),
    workoutCount: base.workoutCount,
    perWeek: base.perWeek,
    longestStreak: streak,
    longestGap: gap,
    totalTonnageKg: base.totalTonnageKg,
    avgTonnageKg: base.avgTonnageKg,
    maxTonnageKg: base.maxTonnageKg,
    minTonnageKg,
    tonnageTrend,
    totalSets: base.totalSets,
    oneRmRecordCount,
    tonnageRecord,
    strengthTop: base.strength.slice(0, 5).map((e) => ({
      name: e.name,
      currentOneRm: e.currentOneRm,
      deltaKg: e.deltaKg,
      deltaPct: e.deltaPct,
    })),
    strengthStagnant: base.strength
      .filter((e) => e.deltaKg !== null && e.deltaKg <= 0)
      .map((e) => e.name),
    balance: base.balance.map((g) => ({ group: g.group, percent: g.percent })),
    dominantGroup: dominantGroup ? { group: dominantGroup.group, percent: dominantGroup.percent } : null,
    laggingGroup: laggingGroup ? { group: laggingGroup.group, percent: laggingGroup.percent } : null,
    balanceRatio,
    prevWorkoutCount: hasPrev ? prev.workoutCount : null,
    workoutCountDelta: hasPrev ? base.workoutCount - prev.workoutCount : null,
    tonnageDeltaPct:
      hasPrev && prev.totalTonnageKg > 0
        ? (base.totalTonnageKg / prev.totalTonnageKg - 1) * 100
        : null,
  };
}

/**
 * Past months (strictly before the current one) that qualify for an archived
 * AI report — at least REPORT_MIN_WORKOUTS training days. Newest first, so the
 * calendar archive lists them the way the spec describes.
 */
export function listReportMonthKeys(workouts: Workout[], today: Date): MonthKey[] {
  const thisMonth = currentMonthKey(today);
  const daysByMonth = new Map<MonthKey, Set<DateKey>>();
  for (const w of workouts) {
    if (!isTrainingWorkout(w)) continue;
    const mk = monthKeyOf(w.date);
    if (mk >= thisMonth) continue; // only completed months
    let set = daysByMonth.get(mk);
    if (!set) {
      set = new Set();
      daysByMonth.set(mk, set);
    }
    set.add(w.date);
  }
  return Array.from(daysByMonth.entries())
    .filter(([, set]) => set.size >= REPORT_MIN_WORKOUTS)
    .map(([mk]) => mk)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}
