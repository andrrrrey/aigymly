import { NextResponse } from 'next/server'
import { getSocialLinks } from '@/lib/settings'

// Reads the database per request; never prerender at build time.
export const dynamic = 'force-dynamic'

// Public social links shown at the bottom of the profile screen.
export async function GET() {
  const social = await getSocialLinks()
  return NextResponse.json(social)
}
