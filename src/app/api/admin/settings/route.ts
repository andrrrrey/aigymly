import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import {
  SETTING_KEYS,
  getSetting,
  setSetting,
  getSecret,
  setSecret,
  getOpenAIModel,
  getOpenAIModelForPrograms,
  getOpenAIModelForStats,
  getTbankConfig,
  DEFAULT_TBANK_TAXATION,
  DEFAULT_TBANK_VAT,
} from '@/lib/settings'

function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const key = await getSecret(SETTING_KEYS.openaiApiKey)
  const model = await getOpenAIModel()
  const modelPrograms = await getOpenAIModelForPrograms()
  const modelStats = await getOpenAIModelForStats()
  const hasEnvKey = !!process.env.OPENAI_API_KEY?.trim()

  const tbank = await getTbankConfig()
  const tbankKeyDb = await getSecret(SETTING_KEYS.tbankTerminalKey)
  const tbankPassDb = await getSecret(SETTING_KEYS.tbankPassword)
  const hasEnvTbankKey = !!process.env.TBANK_TERMINAL_KEY?.trim()
  const hasEnvTbankPass = !!process.env.TBANK_PASSWORD?.trim()

  return NextResponse.json({
    openaiKeySet: !!(key && key.trim()) || hasEnvKey,
    openaiKeyMasked: key && key.trim() ? maskKey(key.trim()) : null,
    openaiKeyFromEnv: !(key && key.trim()) && hasEnvKey,
    model,
    modelPrograms,
    modelStats,
    tbank: {
      terminalKeySet: !!tbank.terminalKey,
      terminalKeyMasked:
        tbankKeyDb && tbankKeyDb.trim() ? maskKey(tbankKeyDb.trim()) : tbank.terminalKey ? '(env)' : null,
      terminalKeyFromEnv: !(tbankKeyDb && tbankKeyDb.trim()) && hasEnvTbankKey,
      passwordSet: !!tbank.password,
      passwordFromEnv: !(tbankPassDb && tbankPassDb.trim()) && hasEnvTbankPass,
      mode: tbank.mode,
      taxation: tbank.taxation,
      vat: tbank.vat,
      companyEmail: tbank.companyEmail ?? '',
    },
  })
}

export async function PUT(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: {
    openaiApiKey?: string
    model?: string
    modelPrograms?: string
    modelStats?: string
    tbankTerminalKey?: string
    tbankPassword?: string
    tbankMode?: string
    tbankTaxation?: string
    tbankVat?: string
    tbankCompanyEmail?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  // Only overwrite secrets when a non-empty value is provided; secrets are
  // stored encrypted (AES-256-GCM) via setSecret.
  if (typeof body.openaiApiKey === 'string' && body.openaiApiKey.trim()) {
    await setSecret(SETTING_KEYS.openaiApiKey, body.openaiApiKey.trim())
  }
  if (typeof body.model === 'string' && body.model.trim()) {
    await setSetting(SETTING_KEYS.openaiModel, body.model.trim())
  }
  if (typeof body.modelPrograms === 'string' && body.modelPrograms.trim()) {
    await setSetting(SETTING_KEYS.openaiModelPrograms, body.modelPrograms.trim())
  }
  if (typeof body.modelStats === 'string' && body.modelStats.trim()) {
    await setSetting(SETTING_KEYS.openaiModelStats, body.modelStats.trim())
  }
  if (typeof body.tbankTerminalKey === 'string' && body.tbankTerminalKey.trim()) {
    await setSecret(SETTING_KEYS.tbankTerminalKey, body.tbankTerminalKey.trim())
  }
  if (typeof body.tbankPassword === 'string' && body.tbankPassword.trim()) {
    await setSecret(SETTING_KEYS.tbankPassword, body.tbankPassword.trim())
  }
  if (body.tbankMode === 'test' || body.tbankMode === 'production') {
    await setSetting(SETTING_KEYS.tbankMode, body.tbankMode)
  }
  if (typeof body.tbankTaxation === 'string') {
    await setSetting(SETTING_KEYS.tbankTaxation, body.tbankTaxation.trim() || DEFAULT_TBANK_TAXATION)
  }
  if (typeof body.tbankVat === 'string') {
    await setSetting(SETTING_KEYS.tbankVat, body.tbankVat.trim() || DEFAULT_TBANK_VAT)
  }
  if (typeof body.tbankCompanyEmail === 'string') {
    await setSetting(SETTING_KEYS.tbankCompanyEmail, body.tbankCompanyEmail.trim())
  }

  return NextResponse.json({ ok: true })
}
