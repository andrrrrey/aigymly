import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement, checkAiQuota } from '@/lib/entitlements'
import {
  generateMonthlyReport,
  OpenAIError,
  type MonthlyReportInput,
} from '@/lib/openai'
import { recordAiUsage } from '@/lib/aiUsage'
import { acquireRateLimit } from '@/lib/rate-limit'
import { REPORT_MIN_WORKOUTS, type TonnageTrend } from '@/lib/statsMonth'

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function int(v: unknown, fallback = 0): number {
  return Math.round(num(v, fallback))
}

function group(raw: any): { group: string; percent: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const g = typeof raw.group === 'string' ? raw.group.slice(0, 60) : ''
  if (!g) return null
  return { group: g, percent: num(raw.percent) }
}

// Rebuilds a trusted MonthlyReportInput from the client payload with fixed key
// order, so JSON.stringify of the result is a deterministic hash key.
function sanitize(raw: any): MonthlyReportInput {
  const trend: TonnageTrend =
    raw?.tonnageTrend === 'up' || raw?.tonnageTrend === 'down' ? raw.tonnageTrend : 'flat'

  const strengthTop = (Array.isArray(raw?.strengthTop) ? raw.strengthTop : [])
    .slice(0, 5)
    .map((e: any) => ({
      name: typeof e?.name === 'string' ? e.name.slice(0, 80) : '',
      currentOneRm: num(e?.currentOneRm),
      deltaKg: e?.deltaKg === null || e?.deltaKg === undefined ? null : num(e.deltaKg),
      deltaPct: e?.deltaPct === null || e?.deltaPct === undefined ? null : num(e.deltaPct),
    }))
    .filter((e: { name: string }) => e.name)

  const strengthStagnant = (Array.isArray(raw?.strengthStagnant) ? raw.strengthStagnant : [])
    .slice(0, 12)
    .map((n: any) => (typeof n === 'string' ? n.slice(0, 80) : ''))
    .filter(Boolean)

  const balance = (Array.isArray(raw?.balance) ? raw.balance : [])
    .slice(0, 12)
    .map((g: any) => group(g))
    .filter((g: unknown): g is { group: string; percent: number } => g !== null)

  return {
    monthKey: typeof raw?.monthKey === 'string' ? raw.monthKey : '',
    monthTitle: typeof raw?.monthTitle === 'string' ? raw.monthTitle.slice(0, 40) : '',
    daysInMonth: int(raw?.daysInMonth, 30),
    workoutCount: int(raw?.workoutCount),
    perWeek: num(raw?.perWeek),
    longestStreak: int(raw?.longestStreak),
    longestGap: int(raw?.longestGap),
    totalTonnageKg: num(raw?.totalTonnageKg),
    avgTonnageKg: num(raw?.avgTonnageKg),
    maxTonnageKg: num(raw?.maxTonnageKg),
    minTonnageKg: num(raw?.minTonnageKg),
    tonnageTrend: trend,
    totalSets: int(raw?.totalSets),
    oneRmRecordCount: int(raw?.oneRmRecordCount),
    tonnageRecord: raw?.tonnageRecord === true,
    strengthTop,
    strengthStagnant,
    balance,
    dominantGroup: group(raw?.dominantGroup),
    laggingGroup: group(raw?.laggingGroup),
    balanceRatio:
      raw?.balanceRatio === null || raw?.balanceRatio === undefined ? null : num(raw.balanceRatio),
    prevWorkoutCount:
      raw?.prevWorkoutCount === null || raw?.prevWorkoutCount === undefined
        ? null
        : int(raw.prevWorkoutCount),
    workoutCountDelta:
      raw?.workoutCountDelta === null || raw?.workoutCountDelta === undefined
        ? null
        : int(raw.workoutCountDelta),
    tonnageDeltaPct:
      raw?.tonnageDeltaPct === null || raw?.tonnageDeltaPct === undefined
        ? null
        : num(raw.tonnageDeltaPct),
  }
}

function hashPayload(input: MonthlyReportInput): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Archived AI reports are a Pro-only feature, like the stats summary.
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
  const monthKey = input.monthKey
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  // A month needs at least REPORT_MIN_WORKOUTS training days to be worth a report.
  if (input.workoutCount < REPORT_MIN_WORKOUTS) {
    return NextResponse.json({ error: 'NO_DATA' }, { status: 400 })
  }

  // Sex comes from the account (trusted), not the request body.
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { sex: true },
  })
  input.sex = user?.sex === 'male' || user?.sex === 'female' ? user.sex : null

  const payloadHash = hashPayload(input)

  // Frozen archive: a month already generated with the same inputs is served
  // from storage — no OpenAI call, no quota. Past months never change, so their
  // reports are effectively permanent.
  const stored = await db.aiMonthlyReport.findUnique({
    where: { userId_monthKey: { userId: session.sub, monthKey } },
  })
  if (stored && stored.payloadHash === payloadHash) {
    return NextResponse.json({ report: JSON.parse(stored.report), cached: true })
  }

  // A fresh generation counts against the monthly AI cap (shared 'stats' bucket).
  const quota = await checkAiQuota(session.sub, 'stats', ent.planId)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'QUOTA_EXCEEDED', limit: quota.limit, used: quota.used, resetAt: quota.resetAt },
      { status: 429 }
    )
  }

  const limit = acquireRateLimit(`${session.sub}:report`)
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason === 'in_progress' ? 'REQUEST_IN_PROGRESS' : 'TOO_MANY_REQUESTS' },
      { status: 429 }
    )
  }

  try {
    const { report, usage } = await generateMonthlyReport(input)
    await recordAiUsage(session.sub, 'stats', 'success', usage)

    const serialized = JSON.stringify(report)
    await db.aiMonthlyReport.upsert({
      where: { userId_monthKey: { userId: session.sub, monthKey } },
      update: { payloadHash, report: serialized },
      create: { userId: session.sub, monthKey, payloadHash, report: serialized },
    })

    return NextResponse.json({ report })
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.code === 'OPENAI_KEY_MISSING') {
        return NextResponse.json({ error: err.code }, { status: 503 })
      }
      await recordAiUsage(session.sub, 'stats', 'error')
      console.error('[monthly-report]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    await recordAiUsage(session.sub, 'stats', 'error')
    console.error('[monthly-report]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  } finally {
    limit.release()
  }
}
