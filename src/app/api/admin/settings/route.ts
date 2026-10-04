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
  getSocialLinks,
  getAiCostControls,
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
  const aiControls = await getAiCostControls()

  const social = await getSocialLinks()
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
    aiControls: {
      softBudgetRubles: aiControls.softBudgetKopecks / 100,
      hardBudgetRubles: aiControls.hardBudgetKopecks / 100,
      programActionsPer30d: aiControls.programActionsPer30d,
      manualStatsRefreshesPer30d: aiControls.manualStatsRefreshesPer30d,
      monthlyReportsPer30d: aiControls.monthlyReportsPer30d,
      autoStatsRefreshHours: aiControls.autoStatsRefreshHours,
    },
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
    social: {
      telegram: social.telegram,
      pinterest: social.pinterest,
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
    socialTelegramUrl?: string
    socialPinterestUrl?: string
    aiSoftBudgetRubles?: number
    aiHardBudgetRubles?: number
    aiProgramActionsPer30d?: number
    aiManualStatsRefreshesPer30d?: number
    aiMonthlyReportsPer30d?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const aiValues = [
    body.aiSoftBudgetRubles,
    body.aiHardBudgetRubles,
    body.aiProgramActionsPer30d,
    body.aiManualStatsRefreshesPer30d,
    body.aiMonthlyReportsPer30d,
  ]
  const hasAiValues = aiValues.some((value) => value !== undefined)
  if (hasAiValues) {
    const [soft, hard, programs, manualStats, reports] = aiValues
    const validMoney = (value: number | undefined, min: number) =>
      typeof value === 'number' && Number.isFinite(value) && value >= min && value <= 100_000
    const validCount = (value: number | undefined) =>
      typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1_000
    if (
      !validMoney(soft, 0) ||
      !validMoney(hard, 0.01) ||
      (soft as number) > (hard as number) ||
      !validCount(programs) ||
      !validCount(manualStats) ||
      !validCount(reports)
    ) {
      return NextResponse.json({ error: 'INVALID_AI_CONTROLS' }, { status: 400 })
    }
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
  // Empty value resets the link to its default (handled by getSocialLinks).
  if (typeof body.socialTelegramUrl === 'string') {
    await setSetting(SETTING_KEYS.socialTelegramUrl, body.socialTelegramUrl.trim())
  }
  if (typeof body.socialPinterestUrl === 'string') {
    await setSetting(SETTING_KEYS.socialPinterestUrl, body.socialPinterestUrl.trim())
  }
  if (hasAiValues) {
    await Promise.all([
      setSetting(SETTING_KEYS.aiSoftBudgetKopecks, String(Math.round(body.aiSoftBudgetRubles! * 100))),
      setSetting(SETTING_KEYS.aiHardBudgetKopecks, String(Math.round(body.aiHardBudgetRubles! * 100))),
      setSetting(SETTING_KEYS.aiProgramActionsPer30d, String(body.aiProgramActionsPer30d)),
      setSetting(
        SETTING_KEYS.aiManualStatsRefreshesPer30d,
        String(body.aiManualStatsRefreshesPer30d)
      ),
      setSetting(SETTING_KEYS.aiMonthlyReportsPer30d, String(body.aiMonthlyReportsPer30d)),
    ])
  }

  return NextResponse.json({ ok: true })
}
