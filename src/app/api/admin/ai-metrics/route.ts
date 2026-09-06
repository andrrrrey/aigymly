import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// Aggregated AI cost/usage metrics over a rolling 30-day window, for the admin
// dashboard (tariff document, section 8). Built entirely from the AiUsage
// journal plus current subscription state.
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const periodDays = 30
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  const [programSuccess, statsSuccess, errorCount, costAgg, payingUsers] = await Promise.all([
    db.aiUsage.count({ where: { feature: 'program', status: 'success', createdAt: { gte: since } } }),
    db.aiUsage.count({ where: { feature: 'stats', status: 'success', createdAt: { gte: since } } }),
    db.aiUsage.count({ where: { status: 'error', createdAt: { gte: since } } }),
    db.aiUsage.aggregate({
      where: { status: 'success', createdAt: { gte: since } },
      _sum: { estimatedCost: true },
    }),
    db.subscription.count({
      where: { status: 'active', currentPeriodEnd: { gt: new Date() } },
    }),
  ])

  const totalCostKopecks = costAgg._sum.estimatedCost ?? 0
  const totalSuccess = programSuccess + statsSuccess
  const totalCalls = totalSuccess + errorCount

  return NextResponse.json({
    periodDays,
    payingUsers,
    programCount: programSuccess,
    statsCount: statsSuccess,
    totalCostKopecks,
    // Kopecks per active paying user; null when there are none.
    costPerPayingUserKopecks: payingUsers > 0 ? Math.round(totalCostKopecks / payingUsers) : null,
    errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
  })
}
