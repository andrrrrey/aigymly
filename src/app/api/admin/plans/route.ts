import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const plans = await db.plan.findMany({
    orderBy: [{ sortOrder: 'asc' }, { priceKopecks: 'asc' }],
  })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: {
    name?: string
    priceKopecks?: number
    periodDays?: number
    active?: boolean
    sortOrder?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (
    !body.name?.trim() ||
    !Number.isInteger(body.priceKopecks) ||
    (body.priceKopecks as number) < 0 ||
    !Number.isInteger(body.periodDays) ||
    (body.periodDays as number) < 1
  ) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const plan = await db.plan.create({
    data: {
      name: body.name.trim(),
      priceKopecks: body.priceKopecks as number,
      periodDays: body.periodDays as number,
      active: body.active ?? true,
      sortOrder: Number.isInteger(body.sortOrder) ? (body.sortOrder as number) : 0,
    },
  })
  return NextResponse.json(plan, { status: 201 })
}
