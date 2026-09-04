import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

// Admin-controlled subscription override: manually grant or revoke Pro for a
// user, independent of any T-Bank payment.
//
// Body:
//   { action: 'grant', days?: number, planId?: string }  — activate Pro
//   { action: 'revoke' }                                 — deactivate Pro
//
// Manual grants set autoRenew=false and carry no RebillId, so the auto-charge
// cron never touches them.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const user = await db.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

  let body: { action?: string; days?: number; planId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (body.action === 'revoke') {
    await db.subscription.upsert({
      where: { userId: id },
      update: { status: 'canceled', currentPeriodEnd: new Date(), autoRenew: false },
      create: { userId: id, status: 'canceled', currentPeriodEnd: new Date(), autoRenew: false },
    })
    return NextResponse.json({ ok: true, isPro: false })
  }

  if (body.action === 'grant') {
    let days = Number.isInteger(body.days) ? (body.days as number) : null
    let planId: string | null = null

    if (body.planId) {
      const plan = await db.plan.findUnique({ where: { id: body.planId } })
      if (!plan) return NextResponse.json({ error: 'PLAN_NOT_FOUND' }, { status: 404 })
      planId = plan.id
      if (days === null) days = plan.periodDays
    }
    if (days === null) days = 365 // sensible default for a manual grant
    if (days < 1 || days > 3650) {
      return NextResponse.json({ error: 'INVALID_DAYS' }, { status: 400 })
    }

    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    await db.subscription.upsert({
      where: { userId: id },
      update: { status: 'active', currentPeriodEnd: end, autoRenew: false, planId },
      create: { userId: id, status: 'active', currentPeriodEnd: end, autoRenew: false, planId },
    })
    return NextResponse.json({ ok: true, isPro: true, currentPeriodEnd: end.toISOString() })
  }

  return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 })
}
