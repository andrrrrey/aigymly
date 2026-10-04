import 'server-only'
import { db } from '@/lib/db'
import type { AiFeature } from '@/lib/aiUsage'
import { getAiCostControls } from '@/lib/settings'

// Number of programs a free (non-subscribed) user may create.
export const FREE_PROGRAM_LIMIT = 1

// Every configurable action quota and monetary budget uses the same rolling
// window so old usage frees capacity gradually instead of at a calendar reset.
export const QUOTA_PERIOD_DAYS = 30

export interface QuotaStatus {
  allowed: boolean
  used: number
  limit: number
  periodDays: number
  // When the oldest counted action ages out of the window, freeing a slot.
  resetAt: Date | null
}

// Counts a user's successful actions in the rolling window. New action types
// are intentionally separate: a monthly report no longer consumes a manual
// summary refresh, while the hard monetary budget still covers every feature.
export async function checkAiQuota(
  userId: string,
  feature: Extract<AiFeature, 'program' | 'stats_manual' | 'monthly_report'>
): Promise<QuotaStatus> {
  const controls = await getAiCostControls()
  const allowance =
    feature === 'program'
      ? controls.programActionsPer30d
      : feature === 'stats_manual'
        ? controls.manualStatsRefreshesPer30d
        : controls.monthlyReportsPer30d
  const periodDays = QUOTA_PERIOD_DAYS
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

export interface AiBudgetStatus {
  spentKopecks: number
  softBudgetKopecks: number
  hardBudgetKopecks: number
  softExceeded: boolean
  hardExceeded: boolean
  periodDays: number
}

// Conservative account-level cost ceiling. Cached responses never reach this
// check, while every successful paid call with a known model contributes its
// estimated cost across programs, summaries and reports.
export async function checkAiBudget(userId: string): Promise<AiBudgetStatus> {
  const controls = await getAiCostControls()
  const since = new Date(Date.now() - QUOTA_PERIOD_DAYS * 24 * 60 * 60 * 1000)
  const result = await db.aiUsage.aggregate({
    where: { userId, status: 'success', createdAt: { gte: since } },
    _sum: { estimatedCost: true },
  })
  const spentKopecks = result._sum.estimatedCost ?? 0
  return {
    spentKopecks,
    softBudgetKopecks: controls.softBudgetKopecks,
    hardBudgetKopecks: controls.hardBudgetKopecks,
    softExceeded: spentKopecks >= controls.softBudgetKopecks,
    hardExceeded: spentKopecks >= controls.hardBudgetKopecks,
    periodDays: QUOTA_PERIOD_DAYS,
  }
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
