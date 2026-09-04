import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement } from '@/lib/entitlements'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const ent = await getEntitlement(session.sub)
  const sub = await db.subscription.findUnique({
    where: { userId: session.sub },
    include: { plan: true },
  })

  return NextResponse.json({
    isPro: ent.isPro,
    status: ent.status,
    autoRenew: ent.autoRenew,
    currentPeriodEnd: ent.currentPeriodEnd ? ent.currentPeriodEnd.toISOString() : null,
    plan: sub?.plan
      ? { id: sub.plan.id, name: sub.plan.name, priceKopecks: sub.plan.priceKopecks, periodDays: sub.plan.periodDays }
      : null,
  })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: { autoRenew?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  if (typeof body.autoRenew !== 'boolean') {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const sub = await db.subscription.findUnique({ where: { userId: session.sub } })
  if (!sub) return NextResponse.json({ error: 'NO_SUBSCRIPTION' }, { status: 404 })

  await db.subscription.update({
    where: { userId: session.sub },
    data: { autoRenew: body.autoRenew },
  })

  return NextResponse.json({ ok: true, autoRenew: body.autoRenew })
}
