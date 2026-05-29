import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const rows = await db.workout.findMany({
    where: { userId: session.sub },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  const workouts = rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    emoji: r.emoji,
    emojiBg: r.emojiBg,
    marker: r.marker,
    exercises: JSON.parse(r.exercises),
    notes: r.notes ?? undefined,
    notifyMinutesBefore: r.notifyMinutesBefore ?? undefined,
    completed: r.completed,
  }))

  return NextResponse.json(workouts)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json()
  const { id, title, date, startTime, endTime, emoji, emojiBg, marker, exercises, notes, notifyMinutesBefore, completed } = body

  const workout = await db.workout.upsert({
    where: { id: id ?? '__new__' },
    update: {
      title,
      date,
      startTime,
      endTime,
      emoji: emoji ?? 'happy',
      emojiBg: emojiBg ?? 'yellow',
      marker: marker ?? 'blue',
      exercises: JSON.stringify(exercises ?? []),
      notes: notes ?? null,
      notifyMinutesBefore: notifyMinutesBefore ?? null,
      completed: completed ?? false,
    },
    create: {
      id,
      userId: session.sub,
      title,
      date,
      startTime,
      endTime,
      emoji: emoji ?? 'happy',
      emojiBg: emojiBg ?? 'yellow',
      marker: marker ?? 'blue',
      exercises: JSON.stringify(exercises ?? []),
      notes: notes ?? null,
      notifyMinutesBefore: notifyMinutesBefore ?? null,
      completed: completed ?? false,
    },
  })

  return NextResponse.json({ id: workout.id })
}
