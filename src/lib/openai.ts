import 'server-only'
import { uid } from '@/lib/utils'
import { getOpenAIKey, getOpenAIModel } from '@/lib/settings'
import type {
  Exercise,
  ExerciseKind,
  Program,
  ProgramDay,
  QuestionnaireAnswers,
} from '@/types'

export type OpenAIErrorCode =
  | 'OPENAI_KEY_MISSING'
  | 'OPENAI_BAD_OUTPUT'
  | 'OPENAI_REQUEST_FAILED'

export class OpenAIError extends Error {
  code: OpenAIErrorCode
  constructor(code: OpenAIErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'похудение / снижение жира',
  gain_muscle: 'набор мышечной массы (гипертрофия)',
  maintain: 'поддержание формы',
  endurance: 'выносливость',
  mobility: 'мобильность и гибкость',
  rehab: 'реабилитация',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'новичок (менее 6 месяцев)',
  intermediate: 'средний (6 мес — 2 года)',
  advanced: 'продвинутый (более 2 лет)',
}

const LOCATION_LABELS: Record<string, string> = {
  gym: 'тренажёрный зал',
  home: 'дом',
  outdoor: 'улица',
  mixed: 'по-разному',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'штанга',
  dumbbells: 'гантели',
  machines: 'тренажёры',
  bands: 'резинки',
  pullup_bar: 'турник',
  bodyweight_only: 'только своё тело',
  cardio_machines: 'кардиотренажёры',
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function buildUserPrompt(a: QuestionnaireAnswers): string {
  const lines: string[] = []
  if (a.goal) lines.push(`Цель: ${GOAL_LABELS[a.goal] ?? a.goal}`)
  if (a.experience)
    lines.push(`Уровень: ${EXPERIENCE_LABELS[a.experience] ?? a.experience}`)
  if (a.age) lines.push(`Возраст: ${a.age}`)
  if (a.heightCm) lines.push(`Рост: ${a.heightCm} см`)
  if (a.weightKg) lines.push(`Вес: ${a.weightKg} кг`)
  if (a.sex)
    lines.push(`Пол: ${a.sex === 'male' ? 'мужской' : a.sex === 'female' ? 'женский' : 'другой'}`)
  if (a.sessionsPerWeek) lines.push(`Тренировок в неделю: ${a.sessionsPerWeek}`)
  if (a.sessionDurationMin)
    lines.push(`Длительность тренировки: ${a.sessionDurationMin} минут`)
  if (a.location) lines.push(`Место: ${LOCATION_LABELS[a.location] ?? a.location}`)
  if (a.equipment?.length)
    lines.push(
      `Оборудование: ${a.equipment.map((e) => EQUIPMENT_LABELS[e] ?? e).join(', ')}`
    )
  if (a.priorityMuscles?.length)
    lines.push(`Приоритетные мышцы: ${a.priorityMuscles.join(', ')}`)
  if (a.injuries?.trim()) lines.push(`Травмы и ограничения: ${a.injuries.trim()}`)
  if (a.preferredDays?.length)
    lines.push(
      `Удобные дни недели: ${a.preferredDays
        .map((d) => WEEKDAY_LABELS[d] ?? d)
        .join(', ')}`
    )
  if (a.preferredTime) lines.push(`Удобное время: ${a.preferredTime}`)
  return lines.join('\n')
}

const SYSTEM_PROMPT = `Ты — опытный персональный тренер и спортивный методист. На основе анкеты пользователя составь персональную программу тренировок.

Требования:
- Количество тренировочных дней должно соответствовать числу тренировок в неделю.
- Используй только доступное пользователю оборудование и место тренировки.
- Обязательно учитывай травмы и ограничения — исключай опасные для них движения.
- Подбирай адекватную уровню нагрузку (подходы, повторения).
- Названия упражнений и описания — на русском языке.
- Для силовых упражнений (kind="strength") заполняй массив sets (2-5 подходов) с reps и weightKg (0 если вес собственного тела или не применим).
- Для кардио (kind="cardio") заполняй durationSec (и distanceM при необходимости), массив sets не нужен.
- weekday — рекомендуемый день недели, число 0-6, где 0=Пн ... 6=Вс. Старайся использовать удобные дни пользователя.

Верни СТРОГО валидный JSON ровно такой структуры, без пояснений и markdown:
{
  "title": "string — короткое название программы",
  "description": "string — 1-2 предложения о программе",
  "days": [
    {
      "title": "string — например 'День 1 — Грудь и трицепс'",
      "focus": "string — основной фокус дня",
      "weekday": 0,
      "notes": "string — необязательные заметки",
      "exercises": [
        {
          "name": "string",
          "kind": "strength | cardio",
          "muscleGroup": "string",
          "sets": [{ "reps": 10, "weightKg": 0 }],
          "durationSec": 0,
          "distanceM": 0
        }
      ]
    }
  ]
}`

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  if (Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

function normalizeExercise(raw: any): Exercise | null {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const kind: ExerciseKind = raw.kind === 'cardio' ? 'cardio' : 'strength'
  const muscleGroup =
    typeof raw.muscleGroup === 'string' && raw.muscleGroup.trim()
      ? raw.muscleGroup.trim()
      : 'Общее'

  if (kind === 'cardio') {
    const durationSec = clampInt(raw.durationSec, 0, 36000, 600)
    const distanceM = clampInt(raw.distanceM, 0, 100000, 0)
    return {
      id: uid(),
      name,
      kind,
      muscleGroup,
      durationSec,
      ...(distanceM > 0 ? { distanceM } : {}),
    }
  }

  const rawSets = Array.isArray(raw.sets) ? raw.sets : []
  let sets = rawSets.map((s: any) => ({
    id: uid(),
    reps: clampInt(s?.reps, 1, 100, 10),
    weightKg: clampInt(s?.weightKg, 0, 500, 0),
  }))
  if (sets.length === 0) {
    sets = [{ id: uid(), reps: 10, weightKg: 0 }]
  }
  return { id: uid(), name, kind, muscleGroup, sets }
}

function normalizeProgram(raw: any, goal?: Program['goal']): Program {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.days)) {
    throw new OpenAIError('OPENAI_BAD_OUTPUT')
  }
  const days: ProgramDay[] = raw.days
    .map((d: any, idx: number): ProgramDay | null => {
      const exercises = (Array.isArray(d?.exercises) ? d.exercises : [])
        .map(normalizeExercise)
        .filter((e: Exercise | null): e is Exercise => e !== null)
      if (exercises.length === 0) return null
      const weekdayRaw = d?.weekday
      const weekday =
        typeof weekdayRaw === 'number' && weekdayRaw >= 0 && weekdayRaw <= 6
          ? Math.round(weekdayRaw)
          : undefined
      return {
        id: uid(),
        title:
          typeof d?.title === 'string' && d.title.trim()
            ? d.title.trim()
            : `День ${idx + 1}`,
        focus:
          typeof d?.focus === 'string' && d.focus.trim() ? d.focus.trim() : undefined,
        weekday,
        notes:
          typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim() : undefined,
        exercises,
      }
    })
    .filter((d: ProgramDay | null): d is ProgramDay => d !== null)

  if (days.length === 0) throw new OpenAIError('OPENAI_BAD_OUTPUT')

  return {
    id: uid(),
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : 'Персональная программа',
    description:
      typeof raw.description === 'string' && raw.description.trim()
        ? raw.description.trim()
        : undefined,
    goal,
    days,
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<string> {
  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })
  } catch (err) {
    throw new OpenAIError('OPENAI_REQUEST_FAILED', String(err))
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new OpenAIError(
      'OPENAI_REQUEST_FAILED',
      `OpenAI ${res.status}: ${text.slice(0, 500)}`
    )
  }

  const json = await res.json().catch(() => null)
  const content = json?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new OpenAIError('OPENAI_BAD_OUTPUT')
  }
  return content
}

export async function generateProgram(
  answers: QuestionnaireAnswers
): Promise<Program> {
  const apiKey = await getOpenAIKey()
  if (!apiKey) throw new OpenAIError('OPENAI_KEY_MISSING')
  const model = await getOpenAIModel()
  const userPrompt = buildUserPrompt(answers)

  // One retry on malformed JSON.
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callOpenAI(apiKey, model, userPrompt)
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new OpenAIError('OPENAI_BAD_OUTPUT')
      }
      return normalizeProgram(parsed, answers.goal)
    } catch (err) {
      lastErr = err
      // Only retry on bad output; rethrow hard failures immediately.
      if (err instanceof OpenAIError && err.code === 'OPENAI_BAD_OUTPUT') continue
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new OpenAIError('OPENAI_BAD_OUTPUT')
}
