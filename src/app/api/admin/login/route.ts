import { NextResponse } from 'next/server'
import { bootstrapAndVerifyAdmin, setAdminCookie } from '@/lib/admin-auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }

    const admin = await bootstrapAndVerifyAdmin(username, password)
    if (!admin) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    await setAdminCookie(admin.id, admin.username)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
