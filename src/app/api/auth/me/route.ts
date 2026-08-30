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
    select: { email: true, emailVerified: true, sex: true, avatarUrl: true, units: true },
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
  const { sex, units, avatarUrl } = body

  if (sex !== undefined && sex !== 'male' && sex !== 'female') {
    return NextResponse.json({ error: 'INVALID_SEX' }, { status: 400 })
  }

  if (units !== undefined && units !== 'metric' && units !== 'imperial') {
    return NextResponse.json({ error: 'INVALID_UNITS' }, { status: 400 })
  }

  // Avatar is a self-contained data URL produced (and downscaled) on the client.
  // Reject anything that isn't a reasonably small image data URL, or `null` to clear.
  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (
      typeof avatarUrl !== 'string' ||
      !avatarUrl.startsWith('data:image/') ||
      avatarUrl.length > 1_500_000
    ) {
      return NextResponse.json({ error: 'INVALID_AVATAR' }, { status: 400 })
    }
  }

  const user = await db.user.update({
    where: { id: session.sub },
    data: {
      ...(sex !== undefined && { sex }),
      ...(units !== undefined && { units }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: { email: true, emailVerified: true, sex: true, avatarUrl: true, units: true },
  })

  return NextResponse.json(user)
}
