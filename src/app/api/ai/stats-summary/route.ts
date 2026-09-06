import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement, checkAiQuota } from '@/lib/entitlements'
import { generateStatsSummary, OpenAIError, type StatsSummaryInput } from '@/lib/openai'
import { recordAiUsage } from '@/lib/aiUsage'
import { acquireRateLimit } from '@/lib/rate-limit'

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function sanitize(raw: any): StatsSummaryInput {
  const strength = Array.isArray(raw?.strength) ? raw.strength : []
  const balance = Array.isArray(raw?.balance) ? raw.balance : []
  return {
    monthTitle: typeof raw?.monthTitle === 'string' ? raw.monthTitle.slice(0, 40) : '',
    workoutCount: Math.round(num(raw?.workoutCount)),
    perWeek: num(raw?.perWeek),
    totalTonnageKg: num(raw?.totalTonnageKg),
    avgTonnageKg: num(raw?.avgTonnageKg),
    totalSets: Math.round(num(raw?.totalSets)),
    strength: strength.slice(0, 12).map((e: any) => ({
      name: typeof e?.name === 'string' ? e.name.slice(0, 80) : '',
      currentOneRm: num(e?.currentOneRm),
      deltaKg: e?.deltaKg === null || e?.deltaKg === undefined ? null : num(e.deltaKg),
      deltaPct: e?.deltaPct === null || e?.deltaPct === undefined ? null : num(e.deltaPct),
    })),
    balance: balance.slice(0, 12).map((g: any) => ({
      group: typeof g?.group === 'string' ? g.group.slice(0, 60) : '',
      percent: num(g?.percent),
    })),
  }
}

// Stable hash of the inputs the summary is built from. `sanitize` produces a
// fixed key order, so JSON.stringify is deterministic enough for a cache key.
function hashPayload(input: StatsSummaryInput): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // AI summary is a Pro-only feature.
  const ent = await getEntitlement(session.sub)
  if (!ent.isPro) {
    return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 402 })
  }

  let raw: any
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const input = sanitize(raw)
  const monthKey = typeof raw?.monthKey === 'string' ? raw.monthKey : ''
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  if (input.workoutCount <= 0) {
    return NextResponse.json({ error: 'NO_DATA' }, { status: 400 })
  }

  // Take the user's sex from their account (trusted), not the request body.
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { sex: true },
  })
  input.sex = user?.sex === 'male' || user?.sex === 'female' ? user.sex : null

  const payloadHash = hashPayload(input)

  // Persistent cache: unchanged month → serve stored summary, no OpenAI call and
  // no quota consumed. Page reloads and revisiting past months are free.
  const cached = await db.aiStatsSummary.findUnique({
    where: { userId_monthKey: { userId: session.sub, monthKey } },
  })
  if (cached && cached.payloadHash === payloadHash) {
    return NextResponse.json({ summary: cached.summary, cached: true })
  }

  // A new unique analysis counts against the monthly cap.
  const quota = await checkAiQuota(session.sub, 'stats', ent.planId)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'QUOTA_EXCEEDED', limit: quota.limit, used: quota.used, resetAt: quota.resetAt },
      { status: 429 }
    )
  }

  const limit = acquireRateLimit(`${session.sub}:stats`)
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason === 'in_progress' ? 'REQUEST_IN_PROGRESS' : 'TOO_MANY_REQUESTS' },
      { status: 429 }
    )
  }

  try {
    const { summary, usage } = await generateStatsSummary(input)
    await recordAiUsage(session.sub, 'stats', 'success', usage)

    await db.aiStatsSummary.upsert({
      where: { userId_monthKey: { userId: session.sub, monthKey } },
      update: { payloadHash, summary, sourceUpdatedAt: new Date() },
      create: { userId: session.sub, monthKey, payloadHash, summary },
    })

    return NextResponse.json({ summary })
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.code === 'OPENAI_KEY_MISSING') {
        return NextResponse.json({ error: err.code }, { status: 503 })
      }
      await recordAiUsage(session.sub, 'stats', 'error')
      console.error('[stats-summary]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    await recordAiUsage(session.sub, 'stats', 'error')
    console.error('[stats-summary]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  } finally {
    limit.release()
  }
}
