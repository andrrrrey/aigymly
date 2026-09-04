import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const existing = await db.plan.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

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

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (Number.isInteger(body.priceKopecks) && (body.priceKopecks as number) >= 0)
    data.priceKopecks = body.priceKopecks
  if (Number.isInteger(body.periodDays) && (body.periodDays as number) >= 1)
    data.periodDays = body.periodDays
  if (typeof body.active === 'boolean') data.active = body.active
  if (Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder

  const plan = await db.plan.update({ where: { id }, data })
  return NextResponse.json(plan)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const existing = await db.plan.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Soft-delete: deactivate so historical subscriptions/payments keep their FK.
  await db.plan.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
