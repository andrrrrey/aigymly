import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTbankConfig } from '@/lib/settings'
import { verifyNotificationToken } from '@/lib/tbank'

// Public webhook hit by T-Bank after each payment state change. Must verify the
// signature and reply with the plain text body "OK", otherwise T-Bank retries.
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return new NextResponse('OK') // ignore malformed retries
  }

  const cfg = await getTbankConfig()
  if (!cfg.password) {
    console.error('[payments/notification] T-Bank password not configured')
    return new NextResponse('OK')
  }

  if (!verifyNotificationToken(body, cfg.password)) {
    console.error('[payments/notification] invalid token', body.OrderId)
    return new NextResponse('OK')
  }

  const orderId = typeof body.OrderId === 'string' ? body.OrderId : String(body.OrderId ?? '')
  const status = typeof body.Status === 'string' ? body.Status : ''
  const paymentId = body.PaymentId != null ? String(body.PaymentId) : null
  const rebillId = body.RebillId != null ? String(body.RebillId) : null

  const payment = await db.payment.findUnique({ where: { orderId } })
  if (!payment) {
    console.error('[payments/notification] unknown order', orderId)
    return new NextResponse('OK')
  }

  const wasConfirmed = payment.status === 'CONFIRMED'

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status,
      tbankPaymentId: paymentId ?? payment.tbankPaymentId,
      raw: JSON.stringify(body),
    },
  })

  // Activate / renew the subscription only on the first CONFIRMED for this order.
  if (status === 'CONFIRMED' && !wasConfirmed && payment.planId) {
    const plan = await db.plan.findUnique({ where: { id: payment.planId } })
    if (plan) {
      const sub = await db.subscription.findUnique({ where: { userId: payment.userId } })
      const now = Date.now()
      const base =
        sub?.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now
          ? sub.currentPeriodEnd.getTime()
          : now
      const newEnd = new Date(base + plan.periodDays * 24 * 60 * 60 * 1000)

      // A successful card payment saves the card (RebillId) for recurring
      // charges, so a paid subscription opts into auto-renew by default.
      await db.subscription.upsert({
        where: { userId: payment.userId },
        update: {
          planId: plan.id,
          status: 'active',
          currentPeriodEnd: newEnd,
          autoRenew: true,
          ...(rebillId ? { rebillId } : {}),
        },
        create: {
          userId: payment.userId,
          planId: plan.id,
          status: 'active',
          currentPeriodEnd: newEnd,
          autoRenew: true,
          rebillId: rebillId ?? undefined,
        },
      })
    }
  } else if (status === 'REJECTED' && !payment.isRecurrent) {
    // A failed first payment leaves the subscription pending; nothing to renew.
    console.error('[payments/notification] payment rejected', orderId)
  } else if (status === 'REJECTED' && payment.isRecurrent) {
    // A failed auto-charge: mark past_due so the cron can retry within the grace window.
    await db.subscription.updateMany({
      where: { userId: payment.userId, status: 'active' },
      data: { status: 'past_due' },
    })
  }

  return new NextResponse('OK')
}
