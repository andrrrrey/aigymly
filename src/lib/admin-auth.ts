import 'server-only'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'ft_admin'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminJWTPayload {
  adm: string
  username: string
  iat: number
  exp: number
}

export async function setAdminCookie(adminId: string, username: string) {
  const token = jwt.sign({ adm: adminId, username }, SECRET, { expiresIn: '7d' })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function getAdminSession(): Promise<AdminJWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return jwt.verify(token, SECRET) as AdminJWTPayload
  } catch {
    return null
  }
}

export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Verifies admin credentials. Bootstraps the first admin from
 * ADMIN_USERNAME / ADMIN_PASSWORD env vars when the Admin table is empty.
 * Returns the admin id on success, or null on failure.
 */
export async function bootstrapAndVerifyAdmin(
  username: string,
  password: string
): Promise<{ id: string; username: string } | null> {
  const uname = username.trim()
  if (!uname || !password) return null

  const count = await db.admin.count()

  if (count === 0) {
    const envUser = process.env.ADMIN_USERNAME?.trim()
    const envPass = process.env.ADMIN_PASSWORD
    if (!envUser || !envPass) return null
    // Only bootstrap when the supplied credentials match the env seed.
    if (uname !== envUser || password !== envPass) return null
    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await db.admin.create({
      data: { username: uname, passwordHash },
    })
    return { id: admin.id, username: admin.username }
  }

  const admin = await db.admin.findUnique({ where: { username: uname } })
  if (!admin) return null
  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) return null
  return { id: admin.id, username: admin.username }
}
