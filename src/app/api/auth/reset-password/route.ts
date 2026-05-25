import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { token, password, confirmPassword } = await req.json()

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'PASSWORDS_MISMATCH' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })
    }

    const record = await db.token.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!record || record.type !== 'PASSWORD_RESET' || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await db.user.update({ where: { id: record.userId }, data: { passwordHash } })
    await db.token.delete({ where: { id: record.id } })
    await setSessionCookie(record.userId, record.user.email)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
