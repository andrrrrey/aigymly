import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseProgramData, sanitizeManualProgramPayload } from '@/lib/manualPrograms'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const rows = await db.program.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      goal: true,
      source: true,
      status: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const programs = rows.map((r) => {
    const data = parseProgramData(r.data)
    const blocks = Array.isArray(data.blocks) ? data.blocks : []
    const days = Array.isArray(data.days)
      ? data.days
      : blocks.flatMap((block: any) => (Array.isArray(block?.days) ? block.days : []))
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      goal: r.goal ?? undefined,
      source: r.source,
      status: r.status,
      workoutsCount: days.length,
      weeksTotal: typeof data.weeksTotal === 'number' ? data.weeksTotal : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }
  })

  return NextResponse.json(programs)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  const payload = sanitizeManualProgramPayload(raw)
  if (!payload) return NextResponse.json({ error: 'INVALID_PROGRAM' }, { status: 400 })

  const row = await db.program.create({
    data: {
      userId: session.sub,
      title: payload.title,
      description: payload.description ?? null,
      source: 'manual',
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
  return NextResponse.json({ id: row.id }, { status: 201 })
}
