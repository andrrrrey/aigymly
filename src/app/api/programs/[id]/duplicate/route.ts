import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseProgramData, sanitizeManualProgramPayload } from '@/lib/manualPrograms'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const source = await db.program.findUnique({ where: { id } })
  if (!source || source.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const data = parseProgramData(source.data)
  const payload = sanitizeManualProgramPayload({
    title: `Копия — ${source.title}`,
    description: source.description,
    status: 'active',
    days: data.days,
    blocks: data.blocks,
    weeksTotal: data.weeksTotal,
    schedule: data.schedule,
  })
  if (!payload) return NextResponse.json({ error: 'INVALID_PROGRAM' }, { status: 400 })

  const copy = await db.program.create({
    data: {
      userId: session.sub,
      title: payload.title,
      description: payload.description ?? null,
      source: 'manual',
      status: 'active',
      data: JSON.stringify({
        version: 2,
        days: payload.days,
        blocks: payload.blocks,
        weeksTotal: payload.weeksTotal,
        schedule: payload.schedule,
      }),
    },
  })
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
