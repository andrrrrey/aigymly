import 'server-only'
import { db } from '@/lib/db'

// Latest capable OpenAI model used by default. Editable from the admin panel.
export const DEFAULT_OPENAI_MODEL = 'gpt-4o'

export const SETTING_KEYS = {
  openaiApiKey: 'openai_api_key',
  openaiModel: 'openai_model',
} as const

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

export async function getOpenAIKey(): Promise<string | null> {
  const fromDb = await getSetting(SETTING_KEYS.openaiApiKey)
  if (fromDb && fromDb.trim()) return fromDb.trim()
  const fromEnv = process.env.OPENAI_API_KEY
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : null
}

export async function getOpenAIModel(): Promise<string> {
  const fromDb = await getSetting(SETTING_KEYS.openaiModel)
  return fromDb && fromDb.trim() ? fromDb.trim() : DEFAULT_OPENAI_MODEL
}
