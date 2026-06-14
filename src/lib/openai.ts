import 'server-only'
import { uid } from '@/lib/utils'
import { getOpenAIKey, getOpenAIModel } from '@/lib/settings'
import type {
  Exercise,
  ExerciseKind,
  Program,
  ProgramAnalysis,
  ProgramBlock,
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
  lose_weight: 'похудение',
  gain_muscle: 'набор мышечной массы',
  tone: 'тонус и рельеф',
  strength_endurance: 'сила и выносливость',
  rehab: 'реабилитация и ЛФК',
  functional: 'функциональная подготовка',
  general_health: 'общее здоровье и самочувствие',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  never: 'никогда не тренировался',
  beginner: 'новичок (менее 6 месяцев)',
  intermediate: 'средний (6–18 месяцев)',
  advanced: 'продвинутый (более 1.5 лет)',
}

const PLACE_LABELS: Record<string, string> = {
  home: 'дом',
  outdoor: 'уличная площадка',
  gym: 'тренажёрный зал',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  none_mat: 'ничего, только коврик',
  dumbbells: 'гантели',
  barbell: 'штанга и блины',
  bands: 'резиновые петли, эспандеры',
  pullup_bar: 'турник',
  parallel_bars: 'брусья',
  kettlebell: 'гиря',
  fitball: 'фитбол',
  jump_rope: 'скакалка',
  treadmill: 'беговая дорожка',
  bike: 'велотренажёр',
  elliptical: 'эллиптический тренажёр',
  step: 'степ-платформа',
  full_gym: 'полный зал (все тренажёры)',
}

const MENSTRUAL_LABELS: Record<string, string> = {
  skip: 'не хочет указывать',
  not_tracking: 'не отслеживает',
  menstruation: 'менструация (1–5 день)',
  follicular: 'фолликулярная фаза (6–14 день)',
  ovulation: 'овуляция (около 14 дня)',
  luteal: 'лютеиновая фаза (15–28 день)',
}

const BODYSHAPE_LABELS: Record<string, string> = {
  pear: 'груша',
  apple: 'яблоко',
  rectangle: 'прямоугольник',
  hourglass: 'песочные часы',
}

const OCCUPATION_LABELS: Record<string, string> = {
  sedentary: 'сидячая работа',
  on_feet: 'на ногах весь день',
  physical: 'физический труд',
  mixed: 'смешанный тип',
}

const SLEEP_LABELS: Record<string, string> = {
  lt6: 'менее 6 часов',
  '6to7': '6–7 часов',
  '7to8': '7–8 часов',
  gt8: 'более 8 часов',
}

const NUTRITION_LABELS: Record<string, string> = {
  not_tracking: 'не следит',
  intuitive: 'питается интуитивно',
  counting: 'считает калории',
  specific: 'специфическая диета',
}

function buildUserPrompt(a: QuestionnaireAnswers): string {
  const lines: string[] = []

  // Блок 1. Базовый профиль
  if (a.sex) lines.push(`Пол: ${a.sex === 'female' ? 'женский' : 'мужской'}`)
  if (a.age) lines.push(`Возраст: ${a.age} лет`)
  if (a.heightCm) lines.push(`Рост: ${a.heightCm} см`)
  if (a.weightKg) lines.push(`Вес: ${a.weightKg} кг`)
  if (a.heightCm && a.weightKg) {
    const h = a.heightCm / 100
    const bmi = a.weightKg / (h * h)
    lines.push(`ИМТ (рассчитан): ${bmi.toFixed(1)}`)
  }

  // Блок 2. Цель
  if (a.goals?.length)
    lines.push(
      `Цели (первая — основная): ${a.goals.map((g) => GOAL_LABELS[g] ?? g).join(', ')}`
    )

  // Блок 3. Здоровье и ограничения
  if (a.chronicConditions?.trim())
    lines.push(`Хронические заболевания: ${a.chronicConditions.trim()}`)
  if (a.pastInjuries?.trim())
    lines.push(`Травмы и операции в прошлом: ${a.pastInjuries.trim()}`)
  if (a.currentComplaints?.trim())
    lines.push(`Текущие жалобы и боли: ${a.currentComplaints.trim()}`)
  if (a.medicalRestrictions?.trim())
    lines.push(`Противопоказания от врача: ${a.medicalRestrictions.trim()}`)

  // Блок 4. Контекст тренировок
  if (a.place) lines.push(`Место тренировок: ${PLACE_LABELS[a.place] ?? a.place}`)
  if (a.equipment?.length)
    lines.push(
      `Доступное оборудование: ${a.equipment.map((e) => EQUIPMENT_LABELS[e] ?? e).join(', ')}`
    )
  if (a.sessionsPerWeek) lines.push(`Тренировок в неделю: ${a.sessionsPerWeek}`)
  if (a.experience)
    lines.push(`Уровень подготовки: ${EXPERIENCE_LABELS[a.experience] ?? a.experience}`)
  if (a.sessionDurationMin)
    lines.push(`Доступное время на тренировку: ${a.sessionDurationMin} минут`)

  // Блок 5. Женская физиология
  if (a.sex === 'female') {
    if (a.pregnancy)
      lines.push(
        `Беременность: ${
          a.pregnancy === 'yes'
            ? `да${a.pregnancyWeeks ? ` (срок ${a.pregnancyWeeks} нед.)` : ''}`
            : 'нет'
        }`
      )
    if (a.menstrualPhase)
      lines.push(
        `Менструальный цикл: ${MENSTRUAL_LABELS[a.menstrualPhase] ?? a.menstrualPhase}`
      )
    if (a.menopause) lines.push(`Менопауза: ${a.menopause === 'yes' ? 'да' : 'нет'}`)
    if (a.painfulPeriods)
      lines.push(`Болезненные менструации: ${a.painfulPeriods === 'yes' ? 'да' : 'нет'}`)
    if (a.bodyShape)
      lines.push(`Тип фигуры: ${BODYSHAPE_LABELS[a.bodyShape] ?? a.bodyShape}`)
  }

  // Блок 6. Образ жизни и восстановление
  if (a.occupation)
    lines.push(`Род деятельности: ${OCCUPATION_LABELS[a.occupation] ?? a.occupation}`)
  if (a.sleep) lines.push(`Сон: ${SLEEP_LABELS[a.sleep] ?? a.sleep}`)
  if (a.nutrition)
    lines.push(
      `Питание: ${NUTRITION_LABELS[a.nutrition] ?? a.nutrition}${
        a.nutrition === 'specific' && a.nutritionDiet?.trim()
          ? ` (${a.nutritionDiet.trim()})`
          : ''
      }`
    )

  return lines.join('\n')
}

const SYSTEM_PROMPT = `Роль: ты — сертифицированный персональный тренер и спортивный врач-методист с 15-летним стажем. Ты глубоко разбираешься в гендерной физиологии, биомеханике, эндокринологии и нутрициологии. Ты умеешь строить программы как для здорового человека, так и для клиента со сложным анамнезом и реабилитационными потребностями.

Задача: на основе анкеты пользователя разработать персональную программу тренировок на полный мезоцикл — 8 недель. Программа должна: бить точно в указанные цели (в том числе комбинацию целей); не выходить за рамки медицинских ограничений; использовать только доступное оборудование и место; учитывать пол, возраст, антропометрию, уровень подготовки, образ жизни и восстановление.

Структура мезоцикла — два блока по 4 недели:
- Блок 1 (Недели 1–4): адаптация и закладка базы. Акцент на технику, нейромышечную связь, привыкание к режиму. Нагрузка умеренная, объём постепенно растущий. Для новичков этот блок — основной, без резкого усложнения.
- Блок 2 (Недели 5–8): интенсификация и прогрессия. Увеличение рабочих весов на 5–15% относительно Блока 1, сокращение отдыха между подходами, усложнение упражнений, для среднего и продвинутого уровней — продвинутые протоколы (дроп-сеты, суперсеты).

Алгоритм:
1) Приоритеты по целям. Первая цель — основная, остальные — дополнительные. Стиль тренинга, диапазон повторений, отдых, тип кардио и питание подбирай под цели (похудение → многоповторка 15–20 + кардио и дефицит; набор массы → 8–12, профицит; тонус и рельеф → 12–15; сила и выносливость → 1–6, большие веса, длинный отдых; реабилитация/ЛФК → 15–20+ без боли, ЛФК; функциональная → 10–15, баланс/координация; общее здоровье → 12–15, осанка и ССС).
2) Фильтр безопасности. Каждое упражнение пропускай через ограничения здоровья. При пересечении с зоной риска ЗАМЕНЯЙ упражнение на безопасный аналог, а не удаляй. Учитывай хронические заболевания (гипертония, варикоз, диабет, астма, остеохондроз/грыжа → без осевой нагрузки, артрит/артроз → без ударных), травмы (колено, плечо, поясница), текущие боли. Противопоказания врача — категорический приоритет.
3) Антропометрия. ИМТ <18.5 — дефицит; 18.5–24.9 — норма; 25–29.9 — избыток; ≥30 — ожирение (исключи бег, прыжки, HIIT, только низкоинтенсивное кардио). Возраст 40+ — длиннее разминка; 60+ — приоритет безопасности и равновесия.
4) Локация и оборудование — строй только из доступного. Соблюдай лимит времени тренировки.
5) Женская физиология (если пол женский): учитывай беременность (только щадящее ЛФК, без скручиваний/прыжков/тяжестей), фазу цикла (менструация — снизить интенсивность; фолликулярная — пик; лютеиновая — снижение на 20–30%), менопаузу, болезненные менструации, тип фигуры.
6) Образ жизни: сидячая работа → добавь тяги и раскрытие грудной клетки; сон <6ч → снизь объём на 20% с предупреждением; учитывай тип питания.

Требования к структуре:
- Ровно 2 блока. В каждом блоке количество дней (days) строго равно числу тренировок в неделю из анкеты. Блок 2 — тот же сплит, что и Блок 1, но с прогрессией (веса/отдых/сложность).
- Названия упражнений и тексты — на русском языке.
- Для силовых упражнений (kind="strength") заполняй массив sets (2–5 подходов) с reps и weightKg (0, если вес собственного тела или не применим).
- Для кардио (kind="cardio") заполняй durationSec (и distanceM при необходимости), массив sets не нужен.
- weekday — рекомендуемый день недели, число 0–6, где 0=Пн ... 6=Вс.
- Поля analysis — связный текст на русском (можно с переносами строк и маркерами «•»), без markdown-заголовков.

Верни СТРОГО валидный JSON ровно такой структуры, без пояснений и markdown:
{
  "title": "string — короткое название программы",
  "description": "string — 1–2 предложения о программе",
  "analysis": {
    "profile": "string — ИМТ и интерпретация, тип телосложения, уровень подготовки, уровень риска (низкий/средний/высокий) с обоснованием",
    "strategy": "string — приоритеты на 8 недель, ранжирование целей, стиль тренинга, режим повторений, тип кардио, принципы питания, описание двух блоков",
    "recommendations": "string — питание под цель, водный баланс (30 мл на кг веса), сон и восстановление, особые указания"
  },
  "blocks": [
    {
      "name": "Блок 1 — Адаптация",
      "weeks": "Недели 1–4",
      "days": [
        {
          "title": "string — например 'День 1 — Грудь и трицепс'",
          "focus": "string — основной фокус дня",
          "weekday": 0,
          "notes": "string — необязательные заметки (разминка, заминка, отдых)",
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
    },
    {
      "name": "Блок 2 — Интенсификация",
      "weeks": "Недели 5–8",
      "days": [ /* тот же сплит с прогрессией */ ]
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

function normalizeDay(d: any, idx: number): ProgramDay | null {
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
}

function normalizeDays(rawDays: any): ProgramDay[] {
  return (Array.isArray(rawDays) ? rawDays : [])
    .map(normalizeDay)
    .filter((d: ProgramDay | null): d is ProgramDay => d !== null)
}

function normalizeBlock(raw: any, idx: number): ProgramBlock | null {
  const days = normalizeDays(raw?.days)
  if (days.length === 0) return null
  const defaults = [
    { name: 'Блок 1 — Адаптация', weeks: 'Недели 1–4' },
    { name: 'Блок 2 — Интенсификация', weeks: 'Недели 5–8' },
  ]
  const fallback = defaults[idx] ?? { name: `Блок ${idx + 1}`, weeks: '' }
  return {
    name:
      typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
    weeks:
      typeof raw?.weeks === 'string' && raw.weeks.trim() ? raw.weeks.trim() : fallback.weeks,
    days,
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeAnalysis(raw: any): ProgramAnalysis | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const profile = str(raw.profile)
  const strategy = str(raw.strategy)
  const recommendations = str(raw.recommendations)
  if (!profile && !strategy && !recommendations) return undefined
  return { profile, strategy, recommendations }
}

function normalizeProgram(raw: any, goal?: Program['goal']): Program {
  if (!raw || typeof raw !== 'object') {
    throw new OpenAIError('OPENAI_BAD_OUTPUT')
  }

  // Preferred shape: two mesocycle blocks. Fall back to a flat `days` array.
  let blocks: ProgramBlock[] = []
  if (Array.isArray(raw.blocks)) {
    blocks = raw.blocks
      .map(normalizeBlock)
      .filter((b: ProgramBlock | null): b is ProgramBlock => b !== null)
  }
  if (blocks.length === 0 && Array.isArray(raw.days)) {
    const days = normalizeDays(raw.days)
    if (days.length > 0) {
      blocks = [{ name: 'Блок 1 — Адаптация', weeks: 'Недели 1–4', days }]
    }
  }

  if (blocks.length === 0) throw new OpenAIError('OPENAI_BAD_OUTPUT')

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
    blocks,
    days: blocks[0].days,
    analysis: normalizeAnalysis(raw.analysis),
    weeksTotal: 8,
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
  answers: QuestionnaireAnswers,
  comment?: string
): Promise<Program> {
  const apiKey = await getOpenAIKey()
  if (!apiKey) throw new OpenAIError('OPENAI_KEY_MISSING')
  const model = await getOpenAIModel()
  let userPrompt = buildUserPrompt(answers)
  if (comment?.trim()) {
    userPrompt += `\n\nДополнительные пожелания пользователя (обязательно учти при перегенерации программы): ${comment.trim()}`
  }

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
      return normalizeProgram(parsed, answers.goals?.[0])
    } catch (err) {
      lastErr = err
      // Only retry on bad output; rethrow hard failures immediately.
      if (err instanceof OpenAIError && err.code === 'OPENAI_BAD_OUTPUT') continue
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new OpenAIError('OPENAI_BAD_OUTPUT')
}
