import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { ProgramAnalysis, ProgramBlock, ProgramDay } from '@/types'

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
  try {
    const parsed = JSON.parse(row.data)
    if (Array.isArray(parsed?.blocks) && parsed.blocks.length) {
      blocks = parsed.blocks
    }
    if (Array.isArray(parsed?.days)) days = parsed.days
    if (parsed?.analysis && typeof parsed.analysis === 'object') analysis = parsed.analysis
    if (typeof parsed?.weeksTotal === 'number') weeksTotal = parsed.weeksTotal
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
