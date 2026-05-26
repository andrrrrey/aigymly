import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email, password, confirmPassword } = await req.json()

    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'PASSWORDS_MISMATCH' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 })
    }

    // Lazy cleanup of expired tokens
    await db.token.deleteMany({ where: { expiresAt: { lt: new Date() } } })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { email: normalizedEmail, passwordHash },
    })

    const tokenValue = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await db.token.create({
      data: { userId: user.id, type: 'EMAIL_VERIFICATION', token: tokenValue, expiresAt },
    })

    console.log('[register] APP_URL =', process.env['APP_URL'])
    console.log('[register] all env keys with APP or URL:', Object.keys(process.env).filter(k => k.includes('APP') || k.includes('URL')))
    await sendVerificationEmail(normalizedEmail, tokenValue)
    await setSessionCookie(user.id, user.email)

    return NextResponse.json({ ok: true, emailVerified: false }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
