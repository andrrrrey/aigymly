import 'server-only'
import { db } from '@/lib/db'
import type { Exercise } from '@/types'
import {
  summarizeWorkoutsForProgram,
  type ProgramHistorySummary,
} from '@/lib/programStats'

function parseExercises(raw: string): Exercise[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Loads the user's workout log and reduces it to the compact history summary
 * the AI program generator consumes. Shared by the create and regenerate
 * routes so both anchor the plan to the user's real training data.
 */
export async function loadWorkoutHistorySummary(
  userId: string
): Promise<ProgramHistorySummary> {
  const rows = await db.workout.findMany({
    where: { userId },
    select: { date: true, exercises: true },
    orderBy: { date: 'asc' },
  })
  const workouts = rows.map((r) => ({
    date: r.date,
    exercises: parseExercises(r.exercises),
  }))
  return summarizeWorkoutsForProgram(workouts)
}
