import 'server-only'
import { db } from '@/lib/db'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

// Latest capable OpenAI model used by default. Editable from the admin panel.
export const DEFAULT_OPENAI_MODEL = 'gpt-4o'

export const SETTING_KEYS = {
  openaiApiKey: 'openai_api_key',
  openaiModel: 'openai_model',
  // Per-feature model routing. Fall back to `openaiModel` / DEFAULT when unset,
  // so program generation and stats summaries can use different models.
  openaiModelPrograms: 'openai_model_programs',
  openaiModelStats: 'openai_model_stats',
  // T-Bank (Tinkoff) internet acquiring.
  tbankTerminalKey: 'tbank_terminal_key',
  tbankPassword: 'tbank_password',
  tbankMode: 'tbank_mode', // 'test' | 'production' (label only; endpoint is shared)
  tbankTaxation: 'tbank_taxation', // e.g. 'usn_income'
  tbankVat: 'tbank_vat', // e.g. 'none'
  tbankCompanyEmail: 'tbank_company_email', // seller contact for the fiscal receipt
} as const

export const DEFAULT_TBANK_TAXATION = 'usn_income'
export const DEFAULT_TBANK_VAT = 'none'

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

// Encrypted variants for sensitive values (API keys, terminal passwords).
// Reads transparently decrypt, tolerating legacy plaintext rows.
export async function getSecret(key: string): Promise<string | null> {
  const stored = await getSetting(key)
  if (stored === null) return null
  return decryptSecret(stored)
}

export async function setSecret(key: string, value: string): Promise<void> {
  await setSetting(key, encryptSecret(value))
}

export async function getOpenAIKey(): Promise<string | null> {
  const fromDb = await getSecret(SETTING_KEYS.openaiApiKey)
  if (fromDb && fromDb.trim()) return fromDb.trim()
  const fromEnv = process.env.OPENAI_API_KEY
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : null
}

export async function getOpenAIModel(): Promise<string> {
  const fromDb = await getSetting(SETTING_KEYS.openaiModel)
  return fromDb && fromDb.trim() ? fromDb.trim() : DEFAULT_OPENAI_MODEL
}

// Model used for program generation. Falls back to the shared model / default.
export async function getOpenAIModelForPrograms(): Promise<string> {
  const fromDb = await getSetting(SETTING_KEYS.openaiModelPrograms)
  if (fromDb && fromDb.trim()) return fromDb.trim()
  return getOpenAIModel()
}

// Model used for the monthly stats summary. Falls back to the shared model / default.
export async function getOpenAIModelForStats(): Promise<string> {
  const fromDb = await getSetting(SETTING_KEYS.openaiModelStats)
  if (fromDb && fromDb.trim()) return fromDb.trim()
  return getOpenAIModel()
}

export interface TbankConfig {
  terminalKey: string | null
  password: string | null
  mode: 'test' | 'production'
  taxation: string
  vat: string
  companyEmail: string | null
}

// Resolves T-Bank credentials, preferring admin-panel values over env fallbacks.
export async function getTbankConfig(): Promise<TbankConfig> {
  const terminalKeyDb = await getSecret(SETTING_KEYS.tbankTerminalKey)
  const passwordDb = await getSecret(SETTING_KEYS.tbankPassword)
  const modeDb = await getSetting(SETTING_KEYS.tbankMode)
  const taxationDb = await getSetting(SETTING_KEYS.tbankTaxation)
  const vatDb = await getSetting(SETTING_KEYS.tbankVat)
  const companyEmailDb = await getSetting(SETTING_KEYS.tbankCompanyEmail)

  const terminalKey =
    (terminalKeyDb && terminalKeyDb.trim()) ||
    (process.env.TBANK_TERMINAL_KEY && process.env.TBANK_TERMINAL_KEY.trim()) ||
    null
  const password =
    (passwordDb && passwordDb.trim()) ||
    (process.env.TBANK_PASSWORD && process.env.TBANK_PASSWORD.trim()) ||
    null

  return {
    terminalKey,
    password,
    mode: modeDb === 'production' ? 'production' : 'test',
    taxation: (taxationDb && taxationDb.trim()) || DEFAULT_TBANK_TAXATION,
    vat: (vatDb && vatDb.trim()) || DEFAULT_TBANK_VAT,
    companyEmail: (companyEmailDb && companyEmailDb.trim()) || null,
  }
}
