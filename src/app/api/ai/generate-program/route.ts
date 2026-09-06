import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement, FREE_PROGRAM_LIMIT, checkAiQuota } from '@/lib/entitlements'
import { generateProgram, OpenAIError } from '@/lib/openai'
import { recordAiUsage } from '@/lib/aiUsage'
import { acquireRateLimit } from '@/lib/rate-limit'
import type { QuestionnaireAnswers } from '@/types'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Free tier allows a single program; additional programs require a subscription.
  const ent = await getEntitlement(session.sub)
  if (!ent.isPro) {
    const programCount = await db.program.count({ where: { userId: session.sub } })
    if (programCount >= FREE_PROGRAM_LIMIT) {
      return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 402 })
    }
  } else {
    // Pro users have a monthly cap on program actions (create + regenerate).
    const quota = await checkAiQuota(session.sub, 'program', ent.planId)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', limit: quota.limit, used: quota.used, resetAt: quota.resetAt },
        { status: 429 }
      )
    }
  }

  let answers: QuestionnaireAnswers
  try {
    answers = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const limit = acquireRateLimit(`${session.sub}:program`)
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason === 'in_progress' ? 'REQUEST_IN_PROGRESS' : 'TOO_MANY_REQUESTS' },
      { status: 429 }
    )
  }

  try {
    const { program, usage } = await generateProgram(answers)
    await recordAiUsage(session.sub, 'program', 'success', usage)

    const row = await db.program.create({
      data: {
        userId: session.sub,
        title: program.title,
        description: program.description ?? null,
        goal: program.goal ?? null,
        data: JSON.stringify({
          days: program.days,
          blocks: program.blocks,
          analysis: program.analysis,
          weeksTotal: program.weeksTotal,
          answers,
        }),
      },
    })

    return NextResponse.json({ ...program, id: row.id }, { status: 201 })
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.code === 'OPENAI_KEY_MISSING') {
        return NextResponse.json({ error: err.code }, { status: 503 })
      }
      await recordAiUsage(session.sub, 'program', 'error')
      console.error('[generate-program]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    await recordAiUsage(session.sub, 'program', 'error')
    console.error('[generate-program]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  } finally {
    limit.release()
  }
}
