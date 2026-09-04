// Resolves the app's public base URL for building absolute callback URLs
// (T-Bank NotificationURL / SuccessURL / FailURL). Prefers an explicit env
// override, then falls back to the incoming request's forwarded origin.
export function getAppUrl(req?: Request): string {
  const env =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || ''
  if (env) return env.replace(/\/+$/, '')

  if (req) {
    const h = req.headers
    const proto = h.get('x-forwarded-proto') || 'https'
    const host = h.get('x-forwarded-host') || h.get('host')
    if (host) return `${proto}://${host}`.replace(/\/+$/, '')
  }

  return 'http://localhost:3000'
}
