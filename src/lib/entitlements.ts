import 'server-only'
import { db } from '@/lib/db'

// Number of programs a free (non-subscribed) user may create.
export const FREE_PROGRAM_LIMIT = 1

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
