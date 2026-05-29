import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function getOwnedWorkout(id: string, userId: string) {
  const workout = await db.workout.findUnique({ where: { id } })
  if (!workout) return null
  if (workout.userId !== userId) return null
  return workout
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedWorkout(id, session.sub)
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = await req.json()
  const { title, date, startTime, endTime, emoji, emojiBg, marker, exercises, notes, notifyMinutesBefore, completed } = body

  const updated = await db.workout.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(emoji !== undefined && { emoji }),
      ...(emojiBg !== undefined && { emojiBg }),
      ...(marker !== undefined && { marker }),
      ...(exercises !== undefined && { exercises: JSON.stringify(exercises) }),
      ...(notes !== undefined && { notes }),
      ...(notifyMinutesBefore !== undefined && { notifyMinutesBefore }),
      ...(completed !== undefined && { completed }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedWorkout(id, session.sub)
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  await db.workout.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
