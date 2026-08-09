import type { Workout } from '@/types';

export interface ExerciseSetStat {
  weightKg: number;
  reps: number;
}

export interface ExerciseDayStat {
  date: string; // ISO yyyy-MM-dd
  sets: ExerciseSetStat[];
}

export interface ExerciseStat {
  name: string;
  days: ExerciseDayStat[]; // sorted by date, newest first
  totalDoneSets: number;
  lastDate: string; // ISO of most recent day performed
}

// Builds per-exercise statistics from workouts. Only sets the user marked as
// done (галочка) are counted. Exercises are grouped by name; multiple workouts
// on the same date are merged into a single day entry.
export function computeExerciseStats(workouts: Workout[]): ExerciseStat[] {
  // name -> (date -> sets[])
  const byName = new Map<string, Map<string, ExerciseSetStat[]>>();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.kind !== 'strength') continue;
      const doneSets = (ex.sets ?? []).filter((s) => s.done);
      if (doneSets.length === 0) continue;

      let byDate = byName.get(ex.name);
      if (!byDate) {
        byDate = new Map();
        byName.set(ex.name, byDate);
      }
      const existing = byDate.get(w.date) ?? [];
      byDate.set(w.date, [
        ...existing,
        ...doneSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
      ]);
    }
  }

  const stats: ExerciseStat[] = [];
  for (const [name, byDate] of byName) {
    const days: ExerciseDayStat[] = Array.from(byDate.entries())
      .map(([date, sets]) => ({ date, sets }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const totalDoneSets = days.reduce((sum, d) => sum + d.sets.length, 0);
    stats.push({ name, days, totalDoneSets, lastDate: days[0]?.date ?? '' });
  }

  // Most recently performed exercises first.
  stats.sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0));
  return stats;
}

export function computeExerciseStatByName(
  workouts: Workout[],
  name: string
): ExerciseStat | null {
  return computeExerciseStats(workouts).find((s) => s.name === name) ?? null;
}
