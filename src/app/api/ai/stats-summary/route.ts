import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement } from '@/lib/entitlements'
import { generateStatsSummary, OpenAIError, type StatsSummaryInput } from '@/lib/openai'

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

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // AI summary is a Pro-only feature.
  const ent = await getEntitlement(session.sub)
  if (!ent.isPro) {
    return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 402 })
  }

  let input: StatsSummaryInput
  try {
    input = sanitize(await req.json())
  } catch {
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

  try {
    const summary = await generateStatsSummary(input)
    return NextResponse.json({ summary })
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.code === 'OPENAI_KEY_MISSING') {
        return NextResponse.json({ error: err.code }, { status: 503 })
      }
      console.error('[stats-summary]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    console.error('[stats-summary]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
