import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Workout } from '@/types';
import { estimateOneRm } from '@/lib/statsMonth';

// Compact summary of a user's real training history, fed into the AI program
// generator so the plan starts from the weights/frequency the user actually
// works with (not from zero) and addresses lagging muscle groups.
//
// Pure and server-safe: the program routes call it after loading the user's
// workouts from the database. Only strength sets the user ticked off
// (`done === true`) count — the same predicate the stats screens use — so
// future planned workouts never leak into the numbers.

// Window used for "recent" frequency and muscle balance.
const RECENT_WINDOW_DAYS = 28;
// Cap on how many exercises we describe, to bound the prompt size.
const MAX_TOP_EXERCISES = 15;

export interface ProgramHistoryExercise {
  name: string;
  muscleGroup: string;
  sessions: number; // distinct training days with this exercise
  lastDate: string; // ISO of the most recent session
  lastTopWeightKg: number; // best working weight of the most recent session
  lastTopReps: number;
  bestOneRm: number; // best estimated 1RM across the whole history
}

export interface ProgramHistorySummary {
  hasData: boolean;
  totalTrainingDays: number;
  recentTrainingDays: number; // within RECENT_WINDOW_DAYS
  recentPerWeek: number;
  lastTrainingDate: string | null;
  daysSinceLast: number | null;
  topExercises: ProgramHistoryExercise[]; // most recent first
  balance: { group: string; percent: number }[]; // recent-window share of sets
}

interface Agg {
  name: string;
  muscleGroup: string;
  dates: Set<string>;
  lastDate: string;
  lastTopWeightKg: number;
  lastTopReps: number;
  bestOneRm: number;
}

export function summarizeWorkoutsForProgram(
  workouts: Pick<Workout, 'date' | 'exercises'>[],
  now: Date = new Date()
): ProgramHistorySummary {
  const today = now.toISOString().slice(0, 10);

  const trainingDates = new Set<string>();
  const recentTrainingDates = new Set<string>();
  const groupSets = new Map<string, number>();
  let recentTotalSets = 0;
  const byName = new Map<string, Agg>();

  for (const w of workouts) {
    // Skip future/planned workouts — only what actually happened counts.
    if (w.date > today) continue;
    const withinRecent =
      differenceInCalendarDays(parseISO(today), parseISO(w.date)) <= RECENT_WINDOW_DAYS;

    for (const ex of w.exercises ?? []) {
      if (ex.kind !== 'strength') continue;
      const done = (ex.sets ?? []).filter((s) => s.done);
      if (done.length === 0) continue;

      trainingDates.add(w.date);
      if (withinRecent) {
        recentTrainingDates.add(w.date);
        const group = ex.muscleGroup || 'Другое';
        groupSets.set(group, (groupSets.get(group) ?? 0) + done.length);
        recentTotalSets += done.length;
      }

      // Best set of this session (by estimated 1RM), for the working weight.
      let topWeight = 0;
      let topReps = 0;
      let sessionBestOneRm = 0;
      for (const s of done) {
        const oneRm = estimateOneRm(s.weightKg, s.reps);
        if (oneRm >= sessionBestOneRm) {
          sessionBestOneRm = oneRm;
          topWeight = s.weightKg;
          topReps = s.reps;
        }
      }

      let agg = byName.get(ex.name);
      if (!agg) {
        agg = {
          name: ex.name,
          muscleGroup: ex.muscleGroup || 'Другое',
          dates: new Set(),
          lastDate: w.date,
          lastTopWeightKg: topWeight,
          lastTopReps: topReps,
          bestOneRm: sessionBestOneRm,
        };
        byName.set(ex.name, agg);
      }
      agg.dates.add(w.date);
      agg.bestOneRm = Math.max(agg.bestOneRm, sessionBestOneRm);
      // Keep the most recent session's top set as the "current working weight".
      if (w.date >= agg.lastDate) {
        agg.lastDate = w.date;
        agg.lastTopWeightKg = topWeight;
        agg.lastTopReps = topReps;
      }
    }
  }

  const lastTrainingDate =
    trainingDates.size > 0 ? Array.from(trainingDates).sort().at(-1) ?? null : null;
  const daysSinceLast =
    lastTrainingDate !== null
      ? differenceInCalendarDays(parseISO(today), parseISO(lastTrainingDate))
      : null;

  const topExercises: ProgramHistoryExercise[] = Array.from(byName.values())
    .sort((a, b) =>
      a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : b.bestOneRm - a.bestOneRm
    )
    .slice(0, MAX_TOP_EXERCISES)
    .map((a) => ({
      name: a.name,
      muscleGroup: a.muscleGroup,
      sessions: a.dates.size,
      lastDate: a.lastDate,
      lastTopWeightKg: a.lastTopWeightKg,
      lastTopReps: a.lastTopReps,
      bestOneRm: a.bestOneRm,
    }));

  const balance = Array.from(groupSets.entries())
    .map(([group, sets]) => ({
      group,
      percent: recentTotalSets > 0 ? (sets / recentTotalSets) * 100 : 0,
    }))
    .filter((g) => g.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  return {
    hasData: trainingDates.size > 0,
    totalTrainingDays: trainingDates.size,
    recentTrainingDays: recentTrainingDates.size,
    recentPerWeek: (recentTrainingDates.size / RECENT_WINDOW_DAYS) * 7,
    lastTrainingDate,
    daysSinceLast,
    topExercises,
    balance,
  };
}
