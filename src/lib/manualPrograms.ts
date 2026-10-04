import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Exercise, ExerciseSet, ProgramBlock, ProgramDay, ProgramSchedule } from '@/types'

export interface ManualProgramPayload {
  title: string
  description?: string
  status: 'draft' | 'active'
  blocks: ProgramBlock[]
  days: ProgramDay[]
  weeksTotal: number
  schedule: ProgramSchedule
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function numberIn(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function id(value: unknown): string {
  const candidate = text(value, 100)
  return candidate || randomUUID()
}

function sanitizeSet(raw: any): ExerciseSet {
  return {
    id: id(raw?.id),
    reps: Math.round(numberIn(raw?.reps, 10, 0, 999)),
    weightKg: numberIn(raw?.weightKg, 0, 0, 999),
  }
}

function sanitizeExercise(raw: any): Exercise | null {
  const name = text(raw?.name, 100)
  if (!name) return null
  const kind = raw?.kind === 'cardio' ? 'cardio' : 'strength'
  const muscleGroup = text(raw?.muscleGroup, 60) || 'Общее'
  if (kind === 'cardio') {
    return {
      id: id(raw?.id),
      name,
      kind,
      muscleGroup,
      durationSec: Math.round(numberIn(raw?.durationSec, 600, 0, 36_000)),
      distanceM: Math.round(numberIn(raw?.distanceM, 0, 0, 100_000)),
    }
  }
  const sets = (Array.isArray(raw?.sets) ? raw.sets : []).slice(0, 20).map(sanitizeSet)
  return {
    id: id(raw?.id),
    name,
    kind,
    muscleGroup,
    sets: sets.length ? sets : [{ id: randomUUID(), reps: 10, weightKg: 0 }],
  }
}

function sanitizeDay(raw: any, index: number): ProgramDay {
  const exercises = (Array.isArray(raw?.exercises) ? raw.exercises : [])
    .slice(0, 30)
    .map(sanitizeExercise)
    .filter((exercise: Exercise | null): exercise is Exercise => exercise !== null)
  const weekdayRaw = Number(raw?.weekday)
  const weekday = Number.isInteger(weekdayRaw) && weekdayRaw >= 0 && weekdayRaw <= 6
    ? weekdayRaw
    : undefined
  return {
    id: id(raw?.id),
    title: text(raw?.title, 100) || `Тренировка ${index + 1}`,
    focus: text(raw?.focus, 100) || undefined,
    notes: text(raw?.notes, 500) || undefined,
    weekday,
    exercises,
  }
}

export function sanitizeManualProgramPayload(raw: any): ManualProgramPayload | null {
  const title = text(raw?.title, 100)
  if (!title) return null
  const rawDays = Array.isArray(raw?.days)
    ? raw.days
    : Array.isArray(raw?.blocks?.[0]?.days)
      ? raw.blocks[0].days
      : []
  const days: ProgramDay[] = rawDays.slice(0, 14).map(sanitizeDay)
  const status = raw?.status === 'draft' ? 'draft' : 'active'
  if (status === 'active' && (days.length === 0 || days.some((day) => day.exercises.length === 0))) {
    return null
  }

  const weeksTotal = Math.round(numberIn(raw?.weeksTotal ?? raw?.schedule?.weeksTotal, 4, 1, 52))
  const preferredDays = (Array.isArray(raw?.schedule?.preferredDays)
    ? raw.schedule.preferredDays
    : [])
    .map(Number)
    .filter((day: number) => Number.isInteger(day) && day >= 0 && day <= 6)
    .filter((day: number, index: number, all: number[]) => all.indexOf(day) === index)
    .sort((a: number, b: number) => a - b)
  const startTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(raw?.schedule?.startTime ?? ''))
    ? String(raw.schedule.startTime)
    : '18:00'
  const schedule: ProgramSchedule = {
    weeksTotal,
    preferredDays,
    startTime,
    durationMin: Math.round(numberIn(raw?.schedule?.durationMin, 60, 10, 360)),
    notifyMinutesBefore: Math.round(numberIn(raw?.schedule?.notifyMinutesBefore, 0, 0, 1440)),
  }
  const block: ProgramBlock = {
    name: text(raw?.blocks?.[0]?.name, 100) || 'Основной цикл',
    weeks: weeksTotal === 1 ? '1 неделя' : `${weeksTotal} недель`,
    days,
  }
  return {
    title,
    description: text(raw?.description, 500) || undefined,
    status,
    blocks: [block],
    days,
    weeksTotal,
    schedule,
  }
}

export function parseProgramData(raw: string): Record<string, any> {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
