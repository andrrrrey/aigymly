import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateProgram, OpenAIError } from '@/lib/openai'
import type { QuestionnaireAnswers } from '@/types'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

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

  try {
    const program = await generateProgram(answers, body.comment)

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
      console.error('[regenerate-program]', err.code, err.message)
      return NextResponse.json({ error: err.code }, { status: 502 })
    }
    console.error('[regenerate-program]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
