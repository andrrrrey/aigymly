import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { email: true, emailVerified: true, sex: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const { sex } = body

  if (sex !== undefined && sex !== 'male' && sex !== 'female') {
    return NextResponse.json({ error: 'INVALID_SEX' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: session.sub },
    data: { ...(sex !== undefined && { sex }) },
    select: { email: true, emailVerified: true, sex: true },
  })

  return NextResponse.json(user)
}
