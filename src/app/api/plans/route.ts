import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Reads the database per request; never prerender at build time.
export const dynamic = 'force-dynamic'

// Public list of active subscription plans, ordered for display.
export async function GET() {
  const plans = await db.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { priceKopecks: 'asc' }],
    select: { id: true, name: true, priceKopecks: true, periodDays: true },
  })
  return NextResponse.json(plans)
}
