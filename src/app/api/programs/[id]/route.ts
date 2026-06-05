import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { ProgramDay } from '@/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const row = await db.program.findUnique({ where: { id } })
  if (!row || row.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  let days: ProgramDay[] = []
  try {
    const parsed = JSON.parse(row.data)
    if (Array.isArray(parsed?.days)) days = parsed.days
  } catch {
    days = []
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    goal: row.goal ?? undefined,
    days,
    createdAt: row.createdAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const row = await db.program.findUnique({ where: { id } })
  if (!row || row.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  await db.program.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
