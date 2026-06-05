import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

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
      createdAt: true,
    },
  })

  const programs = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    goal: r.goal ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }))

  return NextResponse.json(programs)
}
