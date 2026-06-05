import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const rows = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      sex: true,
      createdAt: true,
      _count: { select: { workouts: true, programs: true } },
    },
  })

  const users = rows.map((u) => ({
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerified,
    sex: u.sex ?? undefined,
    createdAt: u.createdAt.toISOString(),
    workoutsCount: u._count.workouts,
    programsCount: u._count.programs,
  }))

  return NextResponse.json(users)
}
