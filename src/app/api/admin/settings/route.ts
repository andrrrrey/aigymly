import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import {
  SETTING_KEYS,
  getSetting,
  setSetting,
  getOpenAIModel,
} from '@/lib/settings'

function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const key = await getSetting(SETTING_KEYS.openaiApiKey)
  const model = await getOpenAIModel()
  const hasEnvKey = !!process.env.OPENAI_API_KEY?.trim()

  return NextResponse.json({
    openaiKeySet: !!(key && key.trim()) || hasEnvKey,
    openaiKeyMasked: key && key.trim() ? maskKey(key.trim()) : null,
    openaiKeyFromEnv: !(key && key.trim()) && hasEnvKey,
    model,
  })
}

export async function PUT(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: { openaiApiKey?: string; model?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  // Only overwrite the key when a non-empty value is provided.
  if (typeof body.openaiApiKey === 'string' && body.openaiApiKey.trim()) {
    await setSetting(SETTING_KEYS.openaiApiKey, body.openaiApiKey.trim())
  }
  if (typeof body.model === 'string' && body.model.trim()) {
    await setSetting(SETTING_KEYS.openaiModel, body.model.trim())
  }

  return NextResponse.json({ ok: true })
}
