import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getEntitlement, checkAiQuota } from '@/lib/entitlements'
import { generateProgram, OpenAIError } from '@/lib/openai'
import { recordAiUsage } from '@/lib/aiUsage'
import { acquireRateLimit } from '@/lib/rate-limit'
import type { QuestionnaireAnswers } from '@/types'

// Max length of the free-text regeneration comment, to bound prompt size.
const MAX_COMMENT_LEN = 500

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Regenerating a program is a paid AI action — require an active subscription.
  const ent = await getEntitlement(session.sub)
  if (!ent.isPro) {
    return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 402 })
  }

  // Program actions (create + regenerate) share a monthly quota.
  const quota = await checkAiQuota(session.sub, 'program', ent.planId)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'QUOTA_EXCEEDED', limit: quota.limit, used: quota.used, resetAt: quota.resetAt },
      { status: 429 }
    )
  }

  const { id } = await params
  const row = await db.program.findUnique({ where: { id } })
  if (!row || row.userId !== session.sub) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  let body: { comment?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const comment =
    typeof body.comment === 'string' ? body.comment.trim().slice(0, MAX_COMMENT_LEN) : undefined

  // The original questionnaire answers are persisted inside the program's data JSON.
  let answers: QuestionnaireAnswers | undefined
  try {
    const parsed = JSON.parse(row.data)
    if (parsed?.answers && typeof parsed.answers === 'object') answers = parsed.answers
  } catch {
    answers = undefined
  }
  if (!answers) {
    return NextResponse.json({ error: 'ANSWERS_MISSING' }, { status: 400 })
  }

  const limit = acquireRateLimit(`${session.sub}:program`)
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason === 'in_progress' ? 'REQUEST_IN_PROGRESS' : 'TOO_MANY_REQUESTS' },
      { status: 429 }
    )
  }

  try {
    const { program, usage } = await generateProgram(answers, comment)
    await recordAiUsage(session.sub, 'program', 'success', usage)

    const updated = await db.program.update({
      where: { id },
      data: {
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

    return NextResponse.json({ ...program, id: updated.id })
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.code === 'OPENAI_KEY_MISSING') {
        return NextResponse.json({ error: err.code }, { status: 503 })
      }
      await recordAiUsage(session.sub, 'program', 'error')
      console.error('[regenerate-program]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    await recordAiUsage(session.sub, 'program', 'error')
    console.error('[regenerate-program]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  } finally {
    limit.release()
  }
}
