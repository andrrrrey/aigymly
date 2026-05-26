import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { pin } = await req.json()
    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'INVALID_PIN' }, { status: 400 })
    }

    const record = await db.token.findFirst({
      where: {
        userId: session.sub,
        type: 'EMAIL_VERIFICATION',
        token: pin,
        expiresAt: { gt: new Date() },
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'INVALID_PIN' }, { status: 400 })
    }

    await db.user.update({ where: { id: session.sub }, data: { emailVerified: true } })
    await db.token.delete({ where: { id: record.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
