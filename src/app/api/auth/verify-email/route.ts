import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/profile?error=invalid_token', req.url))
  }

  const record = await db.token.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!record || record.type !== 'EMAIL_VERIFICATION' || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/profile?error=invalid_token', req.url))
  }

  await db.user.update({ where: { id: record.userId }, data: { emailVerified: true } })
  await db.token.delete({ where: { id: record.id } })
  await setSessionCookie(record.userId, record.user.email)

  return NextResponse.redirect(new URL('/profile?verified=1', req.url))
}
