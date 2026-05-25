import 'server-only'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'ft_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface JWTPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

export async function setSessionCookie(userId: string, email: string) {
  const token = jwt.sign({ sub: userId, email }, SECRET, { expiresIn: '30d' })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
