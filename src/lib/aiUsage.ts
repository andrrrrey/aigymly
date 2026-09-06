import 'server-only'
import { db } from '@/lib/db'
import type { AiUsageInfo } from '@/lib/openai'

export type AiFeature = 'program' | 'stats'
export type AiUsageStatus = 'success' | 'error'

// Persists a single AI call to the AiUsage journal. Never throws — usage
// accounting must not break the user-facing request; failures are logged.
export async function recordAiUsage(
  userId: string,
  feature: AiFeature,
  status: AiUsageStatus,
  usage?: AiUsageInfo | null,
  fallbackModel?: string
): Promise<void> {
  try {
    await db.aiUsage.create({
      data: {
        userId,
        feature,
        model: usage?.model ?? fallbackModel ?? 'unknown',
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        cachedTokens: usage?.cachedTokens ?? 0,
        estimatedCost: usage?.estimatedCostKopecks ?? null,
        status,
      },
    })
  } catch (err) {
    console.error('[aiUsage] failed to record usage', err)
  }
}
