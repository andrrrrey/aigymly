import 'server-only'
import { db } from '@/lib/db'
import type { AiFeature } from '@/lib/aiUsage'

// Number of programs a free (non-subscribed) user may create.
export const FREE_PROGRAM_LIMIT = 1

// Default Pro AI quotas over a rolling 30-day window (see the tariff document,
// section 4). Overridable per plan via the PlanLimit table.
export const QUOTA_PERIOD_DAYS = 30
export const PROGRAM_ACTIONS_PER_30D = 4 // create + regenerate combined
export const STATS_ANALYSES_PER_30D = 31 // unique stats updates (technical cap)

const DEFAULT_ALLOWANCE: Record<AiFeature, number> = {
  program: PROGRAM_ACTIONS_PER_30D,
  stats: STATS_ANALYSES_PER_30D,
}

export interface QuotaStatus {
  allowed: boolean
  used: number
  limit: number
  periodDays: number
  // When the oldest counted action ages out of the window, freeing a slot.
  resetAt: Date | null
}

async function getAllowance(
  planId: string | null,
  feature: AiFeature
): Promise<{ allowance: number; periodDays: number }> {
  if (planId) {
    const row = await db.planLimit.findUnique({
      where: { planId_feature: { planId, feature } },
    })
    if (row) return { allowance: row.allowance, periodDays: row.periodDays }
  }
  return { allowance: DEFAULT_ALLOWANCE[feature], periodDays: QUOTA_PERIOD_DAYS }
}

// Counts a user's successful AI actions in the rolling window and reports
// whether another is allowed. Only successful calls that actually hit OpenAI
// are recorded in AiUsage, so cached stats summaries never consume quota.
export async function checkAiQuota(
  userId: string,
  feature: AiFeature,
  planId: string | null
): Promise<QuotaStatus> {
  const { allowance, periodDays } = await getAllowance(planId, feature)
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
  const rows = await db.aiUsage.findMany({
    where: { userId, feature, status: 'success', createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  })
  const used = rows.length
  const resetAt =
    rows.length > 0
      ? new Date(rows[0].createdAt.getTime() + periodDays * 24 * 60 * 60 * 1000)
      : null
  return { allowed: used < allowance, used, limit: allowance, periodDays, resetAt }
}

export interface Entitlement {
  isPro: boolean
  status: string
  currentPeriodEnd: Date | null
  autoRenew: boolean
  planId: string | null
}

// A subscription is "pro" while it is active and its paid period has not lapsed.
export async function getEntitlement(userId: string): Promise<Entitlement> {
  const sub = await db.subscription.findUnique({ where: { userId } })

  if (!sub) {
    return { isPro: false, status: 'none', currentPeriodEnd: null, autoRenew: true, planId: null }
  }

  const active =
    sub.status === 'active' &&
    !!sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() > Date.now()

  return {
    isPro: active,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    autoRenew: sub.autoRenew,
    planId: sub.planId,
  }
}

export async function isPro(userId: string): Promise<boolean> {
  return (await getEntitlement(userId)).isPro
}
