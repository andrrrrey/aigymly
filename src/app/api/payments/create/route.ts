import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getTbankConfig } from '@/lib/settings'
import { getAppUrl } from '@/lib/app-url'
import { uid } from '@/lib/utils'
import { tbankInit, buildReceipt, TbankError } from '@/lib/tbank'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: { planId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  if (!body.planId) {
    return NextResponse.json({ error: 'PLAN_REQUIRED' }, { status: 400 })
  }

  const plan = await db.plan.findUnique({ where: { id: body.planId } })
  if (!plan || !plan.active) {
    return NextResponse.json({ error: 'PLAN_NOT_FOUND' }, { status: 404 })
  }

  const cfg = await getTbankConfig()
  if (!cfg.terminalKey || !cfg.password) {
    return NextResponse.json({ error: 'TBANK_NOT_CONFIGURED' }, { status: 503 })
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { email: true },
  })

  // Ensure a subscription row exists (one per user) and mark it pending.
  const subscription = await db.subscription.upsert({
    where: { userId: session.sub },
    update: { planId: plan.id, status: 'pending' },
    create: { userId: session.sub, planId: plan.id, status: 'pending' },
  })

  const orderId = `sub_${session.sub.slice(0, 8)}_${uid()}`

  const payment = await db.payment.create({
    data: {
      userId: session.sub,
      subscriptionId: subscription.id,
      planId: plan.id,
      orderId,
      amountKopecks: plan.priceKopecks,
      status: 'NEW',
      isRecurrent: false,
    },
  })

  const appUrl = getAppUrl(req)

  try {
    const result = await tbankInit(
      { terminalKey: cfg.terminalKey, password: cfg.password },
      {
        amountKopecks: plan.priceKopecks,
        orderId,
        description: `Подписка Ai Gymly — ${plan.name}`,
        customerKey: session.sub,
        recurrent: true,
        notificationUrl: `${appUrl}/api/payments/notification`,
        successUrl: `${appUrl}/subscribe/success?order=${orderId}`,
        failUrl: `${appUrl}/subscribe/fail?order=${orderId}`,
        receipt: buildReceipt({
          name: `Подписка Ai Gymly — ${plan.name}`,
          amountKopecks: plan.priceKopecks,
          taxation: cfg.taxation,
          vat: cfg.vat,
          email: user?.email || cfg.companyEmail,
        }),
      }
    )

    await db.payment.update({
      where: { id: payment.id },
      data: { tbankPaymentId: result.PaymentId ?? null, status: result.Status ?? 'NEW' },
    })

    return NextResponse.json({ paymentUrl: result.PaymentURL, orderId })
  } catch (err) {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'INIT_FAILED' } })
    if (err instanceof TbankError) {
      console.error('[payments/create]', err.code, err.message, err.details)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    console.error('[payments/create]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
