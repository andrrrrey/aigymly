import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseProgramData } from '@/lib/manualPrograms'
import { addMinutesToTime } from '@/lib/utils'
import type { Exercise, ProgramBlock, ProgramDay, ProgramSchedule } from '@/types'

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function weekday(iso: string): number {
  return (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7
}

function nextWeekday(iso: string, target: number): string {
  return addDays(iso, (target - weekday(iso) + 7) % 7)
}

function cloneExercises(exercises: Exercise[]): Exercise[] {
  return exercises.map((exercise) => ({
    ...exercise,
    id: randomUUID(),
    sets: exercise.sets?.map((set) => ({ ...set, id: randomUUID(), done: false })),
  }))
}

function defaultSchedule(data: Record<string, any>): ProgramSchedule {
  const raw = data.schedule ?? {}
  const answers = data.answers ?? {}
  return {
    weeksTotal: Math.min(52, Math.max(1, Math.round(Number(data.weeksTotal ?? raw.weeksTotal) || 1))),
    preferredDays: Array.isArray(raw.preferredDays)
      ? raw.preferredDays
      : Array.isArray(answers.preferredDays)
        ? answers.preferredDays
        : [],
    startTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.startTime ?? answers.preferredTime)
      ? (raw.startTime ?? answers.preferredTime)
      : '18:00',
    durationMin: Math.min(360, Math.max(10, Math.round(Number(raw.durationMin ?? answers.sessionDurationMin) || 60))),
    notifyMinutesBefore: Math.min(1440, Math.max(0, Math.round(Number(raw.notifyMinutesBefore) || 0))),
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const program = await db.program.findUnique({ where: { id } })
  if (!program || program.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  let body: { mode?: 'single' | 'all'; startDate?: string; dayId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  if (!validDate(body.startDate) || (body.mode !== 'single' && body.mode !== 'all')) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const data = parseProgramData(program.data)
  const blocks: ProgramBlock[] = Array.isArray(data.blocks) && data.blocks.length
    ? data.blocks
    : Array.isArray(data.days)
      ? [{ name: 'Программа', weeks: '', days: data.days }]
      : []
  const schedule = defaultSchedule(data)
  const allDays = blocks.flatMap((block) => block.days ?? [])
  if (!allDays.length) return NextResponse.json({ error: 'PROGRAM_EMPTY' }, { status: 400 })

  const planned: Array<{ day: ProgramDay; date: string; week: number; title: string }> = []
  if (body.mode === 'single') {
    const day = allDays.find((candidate) => candidate.id === body.dayId)
    if (!day) return NextResponse.json({ error: 'DAY_NOT_FOUND' }, { status: 404 })
    planned.push({ day, date: body.startDate, week: 1, title: day.title })
  } else {
    const preferredDays = schedule.preferredDays
      .map(Number)
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((a, b) => a - b)
    const weeksPerBlock = Math.max(1, Math.ceil(schedule.weeksTotal / blocks.length))
    let cursor = body.startDate
    let week = 0
    for (const block of blocks) {
      for (let blockWeek = 0; blockWeek < weeksPerBlock && week < schedule.weeksTotal; blockWeek++) {
        week++
        for (let index = 0; index < block.days.length; index++) {
          const day = block.days[index]
          const target = day.weekday ?? preferredDays[index % preferredDays.length]
          const date = Number.isInteger(target) ? nextWeekday(cursor, target) : cursor
          cursor = addDays(date, preferredDays.length ? 1 : 2)
          planned.push({ day, date, week, title: `Неделя ${week} · ${day.title}` })
        }
      }
    }
  }

  await db.$transaction(
    planned.map(({ day, date, week, title }) =>
      db.workout.create({
        data: {
          userId: session.sub,
          title,
          date,
          startTime: schedule.startTime,
          endTime: addMinutesToTime(schedule.startTime, schedule.durationMin),
          emoji: 'neutral',
          emojiBg: 'gray',
          marker: 'gray',
          icon: '/img/normal.svg',
          exercises: JSON.stringify(cloneExercises(day.exercises ?? [])),
          notes: day.notes ?? null,
          notifyMinutesBefore: schedule.notifyMinutesBefore ?? null,
          completed: false,
          programId: program.id,
          programDayId: day.id,
          programWeek: week,
        },
      })
    )
  )

  return NextResponse.json({ ok: true, created: planned.length })
}
