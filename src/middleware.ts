import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function middleware(request: NextRequest) {
  // Any request carrying a Next-Action header is a Server Action invocation.
  // This app has no Server Actions (all client/server traffic goes through
  // /api route handlers), so such a request can only come from a client still
  // running a stale cached bundle from an older deployment. Short-circuit it
  // here: otherwise Next.js throws "Failed to find Server Action ... reading
  // 'workers'", which returns a 500 and floods the error log. A clean 409 is
  // returned instead; the stale client is flushed by the self-destructing
  // service worker the next time it is opened.
  if (request.method === 'POST' && request.headers.has('next-action')) {
    return new NextResponse(null, { status: 409 })
  }

  const token = request.cookies.get('ft_session')?.value

  if (token) {
    try {
      await jwtVerify(token, SECRET)
    } catch {
      const response = NextResponse.next()
      response.cookies.delete('ft_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)'],
}
