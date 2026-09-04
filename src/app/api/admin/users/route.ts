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
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          autoRenew: true,
          plan: { select: { name: true } },
        },
      },
    },
  })

  const now = Date.now()
  const users = rows.map((u) => {
    const sub = u.subscription
    const isPro =
      !!sub &&
      sub.status === 'active' &&
      !!sub.currentPeriodEnd &&
      sub.currentPeriodEnd.getTime() > now
    return {
      id: u.id,
      email: u.email,
      emailVerified: u.emailVerified,
      sex: u.sex ?? undefined,
      createdAt: u.createdAt.toISOString(),
      workoutsCount: u._count.workouts,
      programsCount: u._count.programs,
      subscription: {
        isPro,
        status: sub?.status ?? 'none',
        currentPeriodEnd: sub?.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
        autoRenew: sub?.autoRenew ?? false,
        planName: sub?.plan?.name ?? null,
      },
    }
  })

  return NextResponse.json(users)
}
