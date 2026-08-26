import { format, getDaysInMonth } from 'date-fns';
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
