import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.sub } })
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'ALREADY_VERIFIED' }, { status: 400 })
    }

    // Remove old verification tokens
    await db.token.deleteMany({ where: { userId: user.id, type: 'EMAIL_VERIFICATION' } })

    const tokenValue = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await db.token.create({
      data: { userId: user.id, type: 'EMAIL_VERIFICATION', token: tokenValue, expiresAt },
    })

    await sendVerificationEmail(user.email, tokenValue)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[resend-verification]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
