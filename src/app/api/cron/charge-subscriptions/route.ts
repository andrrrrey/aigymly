import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTbankConfig } from '@/lib/settings'
import { getAppUrl } from '@/lib/app-url'
import { uid } from '@/lib/utils'
import { tbankInit, tbankCharge, buildReceipt, TbankError } from '@/lib/tbank'

// Auto-charges subscriptions whose paid period has ended, using the saved
// RebillId. Intended to be invoked by an external scheduler (Vercel Cron,
// GitHub Action, system cron) with `Authorization: Bearer <CRON_SECRET>`.
//
// Flow per subscription: Init (no Recurrent) to get a fresh PaymentId, then
// Charge with the RebillId. The result is delivered to the notification webhook,
// which extends currentPeriodEnd.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'CRON_NOT_CONFIGURED' }, { status: 503 })
  }
  const auth = req.headers.get('authorization') || ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const cfg = await getTbankConfig()
  if (!cfg.terminalKey || !cfg.password) {
    return NextResponse.json({ error: 'TBANK_NOT_CONFIGURED' }, { status: 503 })
  }
  const creds = { terminalKey: cfg.terminalKey, password: cfg.password }
  const appUrl = getAppUrl(req)

  const now = new Date()
  const due = await db.subscription.findMany({
    where: {
      autoRenew: true,
      status: { in: ['active', 'past_due'] },
      currentPeriodEnd: { lte: now },
      rebillId: { not: null },
    },
    include: { plan: true },
  })

  const results: { userId: string; outcome: string }[] = []

  for (const sub of due) {
    if (!sub.plan || !sub.rebillId) {
      results.push({ userId: sub.userId, outcome: 'skipped_no_plan' })
      continue
    }

    // Idempotency: skip if a renewal attempt already exists for this period.
    const inFlight = await db.payment.findFirst({
      where: {
        subscriptionId: sub.id,
        isRecurrent: true,
        status: { notIn: ['REJECTED', 'INIT_FAILED'] },
        ...(sub.currentPeriodEnd ? { createdAt: { gt: sub.currentPeriodEnd } } : {}),
      },
    })
    if (inFlight) {
      results.push({ userId: sub.userId, outcome: 'skipped_in_flight' })
      continue
    }

    const orderId = `rec_${sub.userId.slice(0, 8)}_${uid()}`
    const payment = await db.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        planId: sub.plan.id,
        orderId,
        amountKopecks: sub.plan.priceKopecks,
        status: 'NEW',
        isRecurrent: true,
      },
    })

    try {
      const init = await tbankInit(creds, {
        amountKopecks: sub.plan.priceKopecks,
        orderId,
        description: `Продление подписки Ai Gymly — ${sub.plan.name}`,
        customerKey: sub.userId,
        notificationUrl: `${appUrl}/api/payments/notification`,
        receipt: buildReceipt({
          name: `Продление подписки Ai Gymly — ${sub.plan.name}`,
          amountKopecks: sub.plan.priceKopecks,
          taxation: cfg.taxation,
          vat: cfg.vat,
          email: cfg.companyEmail,
        }),
      })

      if (!init.PaymentId) throw new TbankError('TBANK_REJECTED', 'no PaymentId from Init')

      await db.payment.update({
        where: { id: payment.id },
        data: { tbankPaymentId: init.PaymentId, status: init.Status ?? 'NEW' },
      })

      const charge = await tbankCharge(creds, { paymentId: init.PaymentId, rebillId: sub.rebillId })
      results.push({ userId: sub.userId, outcome: `charge_${charge.Status ?? 'sent'}` })
    } catch (err) {
      await db.payment.update({ where: { id: payment.id }, data: { status: 'INIT_FAILED' } })
      await db.subscription.update({ where: { id: sub.id }, data: { status: 'past_due' } })
      const detail = err instanceof TbankError ? err.code : 'error'
      console.error('[cron/charge-subscriptions]', sub.userId, detail, err)
      results.push({ userId: sub.userId, outcome: `failed_${detail}` })
    }
  }

  return NextResponse.json({ processed: due.length, results })
}
