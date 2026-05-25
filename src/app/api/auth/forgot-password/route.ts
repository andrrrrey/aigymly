import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Remove previous password reset tokens for this user
    await db.token.deleteMany({ where: { userId: user.id, type: 'PASSWORD_RESET' } })

    const tokenValue = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await db.token.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', token: tokenValue, expiresAt },
    })

    await sendPasswordResetEmail(user.email, tokenValue)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
