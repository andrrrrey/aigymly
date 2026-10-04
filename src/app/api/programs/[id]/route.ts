import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { ProgramAnalysis, ProgramBlock, ProgramDay } from '@/types'
import { parseProgramData, sanitizeManualProgramPayload } from '@/lib/manualPrograms'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const row = await db.program.findUnique({ where: { id } })
  if (!row || row.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  let days: ProgramDay[] = []
  let blocks: ProgramBlock[] | undefined
  let analysis: ProgramAnalysis | undefined
  let weeksTotal: number | undefined
  let schedule
  try {
    const parsed = parseProgramData(row.data)
    if (Array.isArray(parsed?.blocks) && parsed.blocks.length) {
      blocks = parsed.blocks
    }
    if (Array.isArray(parsed?.days)) days = parsed.days
    if (parsed?.analysis && typeof parsed.analysis === 'object') analysis = parsed.analysis
    if (typeof parsed?.weeksTotal === 'number') weeksTotal = parsed.weeksTotal
    if (parsed?.schedule && typeof parsed.schedule === 'object') schedule = parsed.schedule
  } catch {
    days = []
  }

  // Legacy programs stored only `days` — wrap as a single block.
  if (!blocks && days.length) {
    blocks = [{ name: 'Программа', weeks: '', days }]
  }
  if ((!days || !days.length) && blocks?.length) {
    days = blocks[0].days
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    goal: row.goal ?? undefined,
    days,
    blocks,
    analysis,
    weeksTotal,
    schedule,
    source: row.source,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const existing = await db.program.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (existing.source !== 'manual') {
    return NextResponse.json({ error: 'AI_PROGRAM_READ_ONLY' }, { status: 409 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  const payload = sanitizeManualProgramPayload(raw)
  if (!payload) return NextResponse.json({ error: 'INVALID_PROGRAM' }, { status: 400 })

  await db.program.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status,
      data: JSON.stringify({
        version: 2,
        days: payload.days,
        blocks: payload.blocks,
        weeksTotal: payload.weeksTotal,
        schedule: payload.schedule,
      }),
    },
  })
  return NextResponse.json({ id })
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
