import 'server-only'
import { uid } from '@/lib/utils'
import {
  getOpenAIKey,
  getOpenAIModelForPrograms,
  getOpenAIModelForStats,
} from '@/lib/settings'
import type {
  Exercise,
  ExerciseKind,
  Program,
  ProgramAnalysis,
  ProgramBlock,
  ProgramDay,
  QuestionnaireAnswers,
} from '@/types'
import type { MonthReportInput, MonthlyReport } from '@/lib/statsMonth'

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

// ── Token usage & cost estimation ──────────────────────────────────────────

// Model prices in USD per 1M tokens (input / output). Sourced from the tariff
// document; used only to estimate cost — the source of truth is the stored
// `usage`. Unknown models yield a null estimate rather than a wrong number.
const MODEL_PRICING_USD_PER_M: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
}

// Budget FX rate with a margin over the official rate (see the tariff document).
const RUB_PER_USD = 100

export interface AiUsageInfo {
  model: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  // Estimated cost in kopecks (Int, aggregation-safe); null when the model's
  // pricing is unknown.
  estimatedCostKopecks: number | null
}

// Estimated cost in kopecks. `inputTokens` already includes cached tokens
// (which are billed cheaper), so this is a conservative upper bound.
export function estimateCostKopecks(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const p = MODEL_PRICING_USD_PER_M[model]
  if (!p) return null
  const usd = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
  return Math.round(usd * RUB_PER_USD * 100)
}

function parseUsage(model: string, rawUsage: any): AiUsageInfo {
  const inputTokens = Math.max(0, Math.round(Number(rawUsage?.prompt_tokens) || 0))
  const outputTokens = Math.max(0, Math.round(Number(rawUsage?.completion_tokens) || 0))
  const cachedTokens = Math.max(
    0,
    Math.round(Number(rawUsage?.prompt_tokens_details?.cached_tokens) || 0)
  )
  return {
    model,
    inputTokens,
    outputTokens,
    cachedTokens,
    estimatedCostKopecks: estimateCostKopecks(model, inputTokens, outputTokens),
  }
}

// Sums the token usage of two OpenAI calls (e.g. generation + safety audit) so
// callers still record a single, correct usage figure. Cost is re-estimated
// from the combined token counts; if either call's model is unpriced the
// combined estimate is null rather than a partial number.
function combineUsage(a: AiUsageInfo, b: AiUsageInfo): AiUsageInfo {
  const inputTokens = a.inputTokens + b.inputTokens
  const outputTokens = a.outputTokens + b.outputTokens
  const estimatedCostKopecks =
    a.estimatedCostKopecks === null || b.estimatedCostKopecks === null
      ? null
      : a.estimatedCostKopecks + b.estimatedCostKopecks
  return {
    model: a.model === b.model ? a.model : `${a.model}+${b.model}`,
    inputTokens,
    outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    estimatedCostKopecks,
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

  // Блок 7. Дополнительные пожелания пользователя — обязательно учитывать.
  if (a.notes?.trim())
    lines.push(
      `Дополнительные пожелания пользователя (обязательно учти при составлении программы): ${a.notes.trim()}`
    )

  return lines.join('\n')
}

const SYSTEM_PROMPT = `Роль: ты — сертифицированный персональный тренер и методист по физической подготовке с большим стажем. Ты хорошо разбираешься в гендерной физиологии, биомеханике и основах нутрициологии. ВАЖНО: ты не врач и не ставишь диагнозы. Твои рекомендации носят общий информационный характер и не заменяют консультацию врача.

Безопасность (АБСОЛЮТНЫЙ приоритет, важнее любых целей и пожеланий — цель никогда не оправдывает опасное упражнение):

ШАГ 0 (обязателен ДО подбора упражнений). Внимательно прочитай поля «Хронические заболевания», «Травмы и операции в прошлом», «Текущие жалобы и боли», «Противопоказания от врача» И «Дополнительные пожелания пользователя»: ограничение по здоровью может быть указано в любом из них, в свободной форме, с опечатками или иными словами (например, «протрузия», «грыжа», «диастаз», «гемангиома», «болит спина»). Для КАЖДОГО найденного состояния сначала определи, какие типы нагрузки запрещены и чем их заменить, и только потом составляй программу. Ни одно упражнение в итоговой программе не должно нарушать эти запреты — перепроверь весь список перед выдачей.

Карта противопоказаний (применяй по аналогии и к близким/родственным состояниям):
- Протрузия, грыжа, остеохондроз, боли в пояснице, гемангиома позвонка → ИСКЛЮЧИ осевую и компрессионную нагрузку на позвоночник, ударную нагрузку и нагруженное разгибание/сгибание поясницы: гак-приседания, приседания и жимы стоя со штангой на спине/плечах, становую тягу, тягу штанги в наклоне со свободным весом, классическую гиперэкстензию с прогибом, прыжки, бег. ЗАМЕНЯЙ на варианты с опорой спины и нейтральным позвоночником: жим ногами в умеренной амплитуде, тренажёры с упором для спины, ягодичный мост, «птица-собака», планка, тяги в тренажёре сидя с упором в грудь.
- Диастаз прямых мышц живота → ИСКЛЮЧИ рост внутрибрюшного давления и прямую нагрузку на прямую мышцу: классические скручивания и подъёмы корпуса/ног, отжимания с провисанием живота, натуживание с задержкой дыхания, тяжёлую осевую нагрузку. ЗАМЕНЯЙ на глубокие мышцы кора: диафрагмальное дыхание с втягиванием живота, «мёртвый жук» без отрыва поясницы, отведение ног лёжа, изометрия поперечной мышцы живота.
- Колено (травма, артроз) → без глубоких приседаний, выпадов с большим весом и ударной нагрузки; замена на жим ногами в безопасной амплитуде, разгибания/сгибания в тренажёре с умеренным весом.
- Плечо → без жимов из-за головы, широких разведений через боль и резких рывковых движений.
- Гипертония, болезни сердца → без задержки дыхания и натуживания, без положения головой вниз; кардио только низкой–средней интенсивности.
- Беременность → только щадящее ЛФК, без скручиваний, прыжков, тяжестей и длительного положения лёжа на спине во 2–3 триместре.
Прямое противопоказание врача — категорический приоритет: указанную им нагрузку исключай полностью, без исключений.

Оцени уровень риска анкеты. Отнеси к ВЫСОКОМУ риску: беременность и послеродовой период, недавние операции и незавершённую реабилитацию, острые травмы и боли, серьёзные хронические заболевания (неконтролируемая гипертония, болезни сердца, диабет с осложнениями, тяжёлые заболевания позвоночника/суставов) и любые состояния с явными противопоказаниями врача. Для высокорисковых анкет НЕ выдавай интенсивную или потенциально опасную программу — только максимально щадящий консервативный вариант из безопасных общеукрепляющих движений, И обязательно рекомендуй очную консультацию врача/специалиста ЛФК до начала тренировок.

В поле analysis.recommendations В САМОМ НАЧАЛЕ добавь блок «⚠️ Учтённые ограничения»: перечисли каждое указанное состояние и какие типы упражнений из-за него исключены и чем заменены. Если ограничений в анкете нет — прямо укажи, что ограничения не указаны. В конце того же поля обязателен краткий дисклеймер: рекомендации носят общий характер, не заменяют консультацию врача; при боли или ухудшении самочувствия нужно прекратить занятия и обратиться к специалисту.

Задача: на основе анкеты пользователя разработать персональную программу тренировок на полный мезоцикл — 8 недель. Программа должна: бить точно в указанные цели (в том числе комбинацию целей); не выходить за рамки медицинских ограничений и приоритета безопасности выше; использовать только доступное оборудование и место; учитывать пол, возраст, антропометрию, уровень подготовки, образ жизни и восстановление.

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
    "recommendations": "string — начни с блока «⚠️ Учтённые ограничения» (каждое состояние из анкеты и какие упражнения исключены/заменены; если ограничений нет — так и напиши), затем питание под цель, водный баланс (30 мл на кг веса), сон и восстановление, особые указания. В конце обязателен краткий дисклеймер: рекомендации носят общий характер и не заменяют консультацию врача; при боли или ухудшении самочувствия прекратить занятия и обратиться к специалисту"
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

// Upper bound on the JSON program response, so a runaway generation cannot rack
// up output-token cost. An 8-week, two-block program fits comfortably below this.
const PROGRAM_MAX_TOKENS = 8000

// Program generation is safety-critical (health contraindications must be
// respected), so we keep sampling low-variance rather than creative.
const PROGRAM_TEMPERATURE = 0.2

async function callOpenAI(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<{ content: string; usage: AiUsageInfo }> {
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
        temperature: PROGRAM_TEMPERATURE,
        max_tokens: PROGRAM_MAX_TOKENS,
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
  return { content, usage: parseUsage(model, json?.usage) }
}

// ── Stats summary (the «Сводка от AI» block on /stats) ─────────────────────

export interface StatsSummaryInput {
  monthTitle: string
  sex?: 'male' | 'female' | null
  workoutCount: number
  perWeek: number
  totalTonnageKg: number
  avgTonnageKg: number
  totalSets: number
  strength: {
    name: string
    currentOneRm: number
    deltaKg: number | null
    deltaPct: number | null
  }[]
  balance: { group: string; percent: number }[]
}

const STATS_SUMMARY_SYSTEM = `Ты — опытный, доброжелательный персональный тренер. На основе месячной статистики тренировок пользователя дай короткую, живую и мотивирующую сводку на русском языке.

Требования:
- 3–5 коротких абзацев или пунктов, без markdown-заголовков.
- Отметь главное: регулярность, динамику нагрузки, прогресс силы (по расчётному максимуму), баланс мышечных групп.
- Дай 1–2 конкретные рекомендации на следующий месяц.
- Тон — поддерживающий, по-человечески, без канцелярита и без выдуманных цифр. Используй только предоставленные данные.
- Учитывай пол пользователя (если указан): гендерную физиологию, типичные акценты и формулировки рекомендаций; согласуй род в обращении к пользователю.
- Не используй обращения вида «Уважаемый пользователь». Обращайся на «ты».`

function buildStatsSummaryPrompt(s: StatsSummaryInput): string {
  const lines: string[] = []
  lines.push(`Месяц: ${s.monthTitle}`)
  if (s.sex) lines.push(`Пол: ${s.sex === 'female' ? 'женский' : 'мужской'}`)
  lines.push(`Тренировок за месяц: ${s.workoutCount}`)
  lines.push(`В среднем в неделю: ${s.perWeek.toFixed(1)}`)
  lines.push(`Всего выполненных подходов: ${s.totalSets}`)
  lines.push(`Общая нагрузка за месяц: ${Math.round(s.totalTonnageKg)} кг`)
  lines.push(`Средняя нагрузка за тренировку: ${Math.round(s.avgTonnageKg)} кг`)

  if (s.strength.length) {
    lines.push('')
    lines.push('Прогресс силы (расчётный максимум 1ПМ):')
    for (const ex of s.strength.slice(0, 8)) {
      const delta =
        ex.deltaKg === null
          ? 'новое упражнение в этом месяце'
          : `${ex.deltaKg >= 0 ? '+' : ''}${ex.deltaKg.toFixed(1)} кг${
              ex.deltaPct !== null ? ` (${ex.deltaPct >= 0 ? '+' : ''}${ex.deltaPct.toFixed(1)}%)` : ''
            }`
      lines.push(`- ${ex.name}: 1ПМ ${Math.round(ex.currentOneRm)} кг, изменение ${delta}`)
    }
  }

  if (s.balance.length) {
    lines.push('')
    lines.push('Баланс мышечных групп (доля подходов):')
    for (const g of s.balance) {
      lines.push(`- ${g.group}: ${Math.round(g.percent)}%`)
    }
  }

  return lines.join('\n')
}

// Upper bound on the stats summary output (a few short paragraphs).
const STATS_MAX_TOKENS = 700

async function callOpenAIText(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; usage: AiUsageInfo }> {
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: STATS_MAX_TOKENS,
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
  return { content: content.trim(), usage: parseUsage(model, json?.usage) }
}

export interface StatsSummaryResult {
  summary: string
  usage: AiUsageInfo
}

export async function generateStatsSummary(
  input: StatsSummaryInput
): Promise<StatsSummaryResult> {
  const apiKey = await getOpenAIKey()
  if (!apiKey) throw new OpenAIError('OPENAI_KEY_MISSING')
  const model = await getOpenAIModelForStats()
  const { content, usage } = await callOpenAIText(
    apiKey,
    model,
    STATS_SUMMARY_SYSTEM,
    buildStatsSummaryPrompt(input)
  )
  return { summary: content, usage }
}

// ── Safety audit (second pass over a generated program) ────────────────────

// True when the questionnaire carries any health constraint worth a dedicated
// safety review. The audit is a paid extra OpenAI call, so we only run it for
// answers that actually declare a limitation.
function hasHealthConstraints(a: QuestionnaireAnswers): boolean {
  return Boolean(
    a.chronicConditions?.trim() ||
      a.pastInjuries?.trim() ||
      a.currentComplaints?.trim() ||
      a.medicalRestrictions?.trim() ||
      a.pregnancy === 'yes'
  )
}

// Compact, health-only view of the questionnaire for the auditor prompt.
function buildHealthContext(a: QuestionnaireAnswers, comment?: string): string {
  const lines: string[] = []
  if (a.chronicConditions?.trim())
    lines.push(`Хронические заболевания: ${a.chronicConditions.trim()}`)
  if (a.pastInjuries?.trim())
    lines.push(`Травмы и операции в прошлом: ${a.pastInjuries.trim()}`)
  if (a.currentComplaints?.trim())
    lines.push(`Текущие жалобы и боли: ${a.currentComplaints.trim()}`)
  if (a.medicalRestrictions?.trim())
    lines.push(`Противопоказания от врача: ${a.medicalRestrictions.trim()}`)
  if (a.sex === 'female' && a.pregnancy === 'yes')
    lines.push(
      `Беременность: да${a.pregnancyWeeks ? ` (срок ${a.pregnancyWeeks} нед.)` : ''}`
    )
  if (a.sex === 'female' && a.menstrualPhase)
    lines.push(`Менструальный цикл: ${MENSTRUAL_LABELS[a.menstrualPhase] ?? a.menstrualPhase}`)
  if (a.notes?.trim())
    lines.push(`Дополнительные пожелания пользователя: ${a.notes.trim()}`)
  if (comment?.trim()) lines.push(`Комментарий к перегенерации: ${comment.trim()}`)
  return lines.join('\n')
}

// Serializes a normalized program back into the generation JSON schema so the
// auditor can return a corrected version in the same shape.
function serializeProgramForAudit(program: Program): string {
  const shaped = {
    title: program.title,
    description: program.description ?? '',
    analysis: program.analysis ?? { profile: '', strategy: '', recommendations: '' },
    blocks: (program.blocks ?? []).map((b) => ({
      name: b.name,
      weeks: b.weeks,
      days: b.days.map((d) => ({
        title: d.title,
        focus: d.focus ?? '',
        weekday: d.weekday ?? 0,
        notes: d.notes ?? '',
        exercises: d.exercises.map((e) =>
          e.kind === 'cardio'
            ? {
                name: e.name,
                kind: 'cardio',
                muscleGroup: e.muscleGroup,
                durationSec: e.durationSec ?? 0,
                distanceM: e.distanceM ?? 0,
              }
            : {
                name: e.name,
                kind: 'strength',
                muscleGroup: e.muscleGroup,
                sets: (e.sets ?? []).map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
              }
        ),
      })),
    })),
  }
  return JSON.stringify(shaped)
}

const AUDIT_SYSTEM_PROMPT = `Роль: ты — эксперт по безопасности тренировок и реабилитолог. Тебе дают ограничения по здоровью пользователя и уже готовую программу тренировок в формате JSON. Твоя единственная задача — проверить КАЖДОЕ упражнение на противопоказания и исправить программу так, чтобы она была безопасной. Ты не врач и не ставишь диагнозы.

Правила проверки:
- Безопасность важнее целей. Если упражнение противопоказано при указанном состоянии — ЗАМЕНИ его на безопасный аналог, работающий на ту же мышечную группу, а не удаляй (кроме случаев, когда безопасной замены нет).
- Карта противопоказаний (применяй и к близким состояниям):
  • Протрузия, грыжа, остеохондроз, боли в пояснице, гемангиома позвонка → без осевой/компрессионной нагрузки на позвоночник, без ударной нагрузки и нагруженного разгибания/сгибания поясницы (гак-приседания, приседания и жимы стоя со штангой, становая тяга, тяга штанги в наклоне, классическая гиперэкстензия, прыжки, бег). Замена — упражнения с опорой спины и нейтральным позвоночником.
  • Диастаз прямых мышц живота → без роста внутрибрюшного давления и прямой нагрузки на прямую мышцу (классические скручивания и подъёмы корпуса/ног, отжимания с провисанием живота, натуживание, тяжёлая осевая). Замена — глубокие мышцы кора (дыхание с втягиванием живота, «мёртвый жук», отведение ног лёжа).
  • Колено → без глубоких приседаний, выпадов с большим весом и ударной нагрузки.
  • Плечо → без жимов из-за головы, широких разведений через боль и рывков.
  • Гипертония, болезни сердца → без задержки дыхания, натуживания и положения головой вниз; кардио низкой–средней интенсивности.
  • Беременность → только щадящее ЛФК, без скручиваний, прыжков, тяжестей.
  • Прямое противопоказание врача исключай полностью.
- Снижай неоправданно высокие рабочие веса и амплитуды для указанных ограничений.
- Сохрани структуру программы БЕЗ ИЗМЕНЕНИЙ: то же число блоков, то же число дней в каждом блоке, то же назначение дней. Меняй только упражнения, их параметры и тексты analysis.
- В analysis.recommendations в начале обнови блок «⚠️ Учтённые ограничения»: перечисли, что и почему было заменено при проверке. Сохрани дисклеймер в конце.
- Все тексты и названия — на русском языке.

Верни СТРОГО валидный JSON ровно той же структуры, что тебе дали (title, description, analysis{profile,strategy,recommendations}, blocks[].days[].exercises[]), без пояснений и markdown. Если программа уже полностью безопасна — верни её без изменений в том же формате.`

// Second-pass safety review. Best-effort: any failure returns the original
// program untouched (with null usage) rather than breaking generation.
async function auditProgramSafety(
  apiKey: string,
  model: string,
  healthContext: string,
  program: Program,
  goal?: Program['goal']
): Promise<{ program: Program; usage: AiUsageInfo | null }> {
  const userPrompt = `Ограничения по здоровью пользователя:\n${healthContext}\n\nПрограмма для проверки (JSON):\n${serializeProgramForAudit(
    program
  )}`
  try {
    const { content, usage } = await callOpenAIJson(
      apiKey,
      model,
      AUDIT_SYSTEM_PROMPT,
      userPrompt,
      PROGRAM_MAX_TOKENS,
      PROGRAM_TEMPERATURE
    )
    const parsed = JSON.parse(content)
    const audited = normalizeProgram(parsed, goal)
    return { program: audited, usage }
  } catch (err) {
    // Never let a failed audit fail the whole request — the first-pass program
    // (already generated under the hardened prompt) still stands.
    console.error(
      '[generate-program] safety audit skipped:',
      err instanceof Error ? err.message : String(err)
    )
    return { program, usage: null }
  }
}

export interface ProgramResult {
  program: Program
  usage: AiUsageInfo
}

export async function generateProgram(
  answers: QuestionnaireAnswers,
  comment?: string
): Promise<ProgramResult> {
  const apiKey = await getOpenAIKey()
  if (!apiKey) throw new OpenAIError('OPENAI_KEY_MISSING')
  const model = await getOpenAIModelForPrograms()
  let userPrompt = buildUserPrompt(answers)
  if (comment?.trim()) {
    userPrompt += `\n\nДополнительные пожелания пользователя (обязательно учти при перегенерации программы): ${comment.trim()}`
  }

  // One retry on malformed JSON.
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { content, usage } = await callOpenAI(apiKey, model, userPrompt)
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new OpenAIError('OPENAI_BAD_OUTPUT')
      }
      const program = normalizeProgram(parsed, answers.goals?.[0])

      // Second pass: when the questionnaire declares a health constraint, run a
      // dedicated safety audit that re-checks every exercise for contraindications.
      if (hasHealthConstraints(answers)) {
        const healthContext = buildHealthContext(answers, comment)
        const audit = await auditProgramSafety(
          apiKey,
          model,
          healthContext,
          program,
          answers.goals?.[0]
        )
        return {
          program: audit.program,
          usage: audit.usage ? combineUsage(usage, audit.usage) : usage,
        }
      }

      return { program, usage }
    } catch (err) {
      lastErr = err
      // Only retry on bad output; rethrow hard failures immediately.
      if (err instanceof OpenAIError && err.code === 'OPENAI_BAD_OUTPUT') continue
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new OpenAIError('OPENAI_BAD_OUTPUT')
}

// ── Monthly report (the archived «AI-итоги» card in the stats calendar) ─────

// The user's sex comes from their account (trusted), not the client payload,
// so it is layered on top of the computed report metrics here.
export type MonthlyReportInput = MonthReportInput & { sex?: 'male' | 'female' | null }

export type { MonthlyReport }

const MONTHLY_REPORT_SYSTEM = `Ты — опытный, доброжелательный персональный тренер по силовым тренировкам. На основе месячной статистики пользователя составь развёрнутый, но не перегруженный отчёт-итог за месяц на русском языке.

Отчёт состоит РОВНО из 5 смысловых блоков:
1. Главный вывод — 1–2 предложения о самом важном за месяц.
2. Ключевые цифры с анализом — не просто числа, а связь между ними (например: тренировок стало больше, но средняя нагрузка упала — значит, добавились лёгкие тренировки).
3. Что сработало и что требует внимания.
4. Конкретные рекомендации на следующий месяц (с цифрами, где уместно).
5. Прогноз — что будет, если следовать рекомендациям.

Сначала определи сценарий месяца и выбери акцент:
- Идеальный месяц (нагрузка заметно выросла, высокая частота, баланс в норме, есть рекорды) → похвала и «сохранить темп».
- Прогресс замедляется (нагрузка выросла слабо, частота упала) → назови причину и что изменить.
- Застой (нагрузка почти без изменений, мало рекордов) → предложи сменить программу.
- Спад (нагрузка снизилась) → поддержка и восстановление.
- Дисбаланс (коэффициент баланса > 3) → предупреждение и упражнения на отстающую группу.
- Возвращение (первый полноценный месяц после перерыва) → похвала за возвращение.

Требования:
- Используй ТОЛЬКО предоставленные цифры. Ничего не выдумывай. Если данных для блока мало — будь короче, но блок оставь.
- Тон — поддерживающий, по-человечески, без канцелярита. Обращайся на «ты», без «уважаемый пользователь».
- Учитывай пол пользователя (если указан): согласуй род и акценты рекомендаций.
- Никакого markdown, никаких заголовков внутри значений.

Верни СТРОГО валидный JSON ровно такой структуры, без пояснений и markdown:
{
  "mainConclusion": "string — главный вывод, 1–2 предложения",
  "keyFigures": [
    { "label": "string — показатель, напр. 'Тренировок'", "value": "string — значение, напр. '12'", "note": "string — короткий анализ, напр. '+2 к прошлому месяцу'" }
  ],
  "whatWorked": ["string — что сработало"],
  "needsAttention": ["string — что требует внимания"],
  "recommendations": ["string — конкретная рекомендация на следующий месяц"],
  "forecast": "string — прогноз при следовании рекомендациям, 1–3 предложения"
}`

function trend(t: MonthlyReportInput['tonnageTrend']): string {
  return t === 'up' ? 'рост' : t === 'down' ? 'спад' : 'стабильно'
}

function buildMonthlyReportPrompt(s: MonthlyReportInput): string {
  const lines: string[] = []
  lines.push(`Месяц: ${s.monthTitle}`)
  if (s.sex) lines.push(`Пол пользователя: ${s.sex === 'female' ? 'женский' : 'мужской'}`)

  lines.push('')
  lines.push('РЕГУЛЯРНОСТЬ:')
  lines.push(`- Тренировок за месяц: ${s.workoutCount}`)
  lines.push(`- В среднем в неделю: ${s.perWeek.toFixed(1)}`)
  lines.push(`- Самая длинная серия подряд: ${s.longestStreak} дн.`)
  lines.push(`- Самый длинный пропуск: ${s.longestGap} дн.`)
  if (s.prevWorkoutCount !== null && s.workoutCountDelta !== null) {
    const d = s.workoutCountDelta
    lines.push(
      `- Прошлый месяц: ${s.prevWorkoutCount} тренировок (изменение ${d >= 0 ? '+' : ''}${d})`
    )
  } else {
    lines.push('- За прошлый месяц данных нет (возможно, возвращение после перерыва)')
  }

  lines.push('')
  lines.push('НАГРУЗКА:')
  lines.push(`- Общая нагрузка за месяц: ${Math.round(s.totalTonnageKg)} кг`)
  lines.push(`- Средняя за тренировку: ${Math.round(s.avgTonnageKg)} кг`)
  lines.push(`- Максимальная за тренировку: ${Math.round(s.maxTonnageKg)} кг`)
  lines.push(`- Минимальная за тренировку: ${Math.round(s.minTonnageKg)} кг`)
  lines.push(`- Тренд нагрузки (первая vs последняя тренировка): ${trend(s.tonnageTrend)}`)
  lines.push(`- Всего выполненных подходов: ${s.totalSets}`)
  if (s.tonnageDeltaPct !== null) {
    lines.push(
      `- Изменение общей нагрузки к прошлому месяцу: ${s.tonnageDeltaPct >= 0 ? '+' : ''}${s.tonnageDeltaPct.toFixed(0)}%`
    )
  }

  lines.push('')
  lines.push('РЕКОРДЫ:')
  lines.push(`- Упражнений с новым личным максимумом 1ПМ: ${s.oneRmRecordCount}`)
  lines.push(`- Рекорд по нагрузке за тренировку: ${s.tonnageRecord ? 'да' : 'нет'}`)

  if (s.strengthTop.length) {
    lines.push('')
    lines.push('ПРОГРЕСС СИЛЫ (расчётный 1ПМ, лучшие упражнения):')
    for (const ex of s.strengthTop) {
      const delta =
        ex.deltaKg === null
          ? 'новое упражнение в этом месяце'
          : `${ex.deltaKg >= 0 ? '+' : ''}${ex.deltaKg.toFixed(1)} кг${
              ex.deltaPct !== null ? ` (${ex.deltaPct >= 0 ? '+' : ''}${ex.deltaPct.toFixed(0)}%)` : ''
            }`
      lines.push(`- ${ex.name}: 1ПМ ${Math.round(ex.currentOneRm)} кг, изменение ${delta}`)
    }
  }
  if (s.strengthStagnant.length) {
    lines.push(`Без прогресса (застой): ${s.strengthStagnant.join(', ')}`)
  }

  if (s.balance.length) {
    lines.push('')
    lines.push('БАЛАНС МЫШЕЧНЫХ ГРУПП (доля подходов):')
    for (const g of s.balance) lines.push(`- ${g.group}: ${Math.round(g.percent)}%`)
    if (s.dominantGroup && s.laggingGroup && s.balanceRatio !== null) {
      lines.push(
        `Доминирует: ${s.dominantGroup.group} (${Math.round(s.dominantGroup.percent)}%), отстаёт: ${s.laggingGroup.group} (${Math.round(s.laggingGroup.percent)}%), коэффициент баланса: ${s.balanceRatio.toFixed(1)}`
      )
    }
  }

  return lines.join('\n')
}

// Upper bound on the report output (five short blocks).
const MONTHLY_REPORT_MAX_TOKENS = 1500

async function callOpenAIJson(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature = 0.6
): Promise<{ content: string; usage: AiUsageInfo }> {
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature,
        max_tokens: maxTokens,
      }),
    })
  } catch (err) {
    throw new OpenAIError('OPENAI_REQUEST_FAILED', String(err))
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new OpenAIError('OPENAI_REQUEST_FAILED', `OpenAI ${res.status}: ${text.slice(0, 500)}`)
  }

  const json = await res.json().catch(() => null)
  const content = json?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new OpenAIError('OPENAI_BAD_OUTPUT')
  }
  return { content, usage: parseUsage(model, json?.usage) }
}

function strList(v: unknown, maxItems: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => str(x).slice(0, 400))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeMonthlyReport(raw: any): MonthlyReport {
  if (!raw || typeof raw !== 'object') throw new OpenAIError('OPENAI_BAD_OUTPUT')

  const keyFigures = (Array.isArray(raw.keyFigures) ? raw.keyFigures : [])
    .slice(0, 8)
    .map((k: any) => ({
      label: str(k?.label).slice(0, 80),
      value: str(k?.value).slice(0, 80),
      note: str(k?.note).slice(0, 200),
    }))
    .filter((k: MonthlyReport['keyFigures'][number]) => k.label || k.value)

  const report: MonthlyReport = {
    mainConclusion: str(raw.mainConclusion).slice(0, 600),
    keyFigures,
    whatWorked: strList(raw.whatWorked, 6),
    needsAttention: strList(raw.needsAttention, 6),
    recommendations: strList(raw.recommendations, 8),
    forecast: str(raw.forecast).slice(0, 600),
  }

  // A report with nothing substantive is treated as a bad generation.
  if (
    !report.mainConclusion &&
    report.keyFigures.length === 0 &&
    report.whatWorked.length === 0 &&
    report.recommendations.length === 0
  ) {
    throw new OpenAIError('OPENAI_BAD_OUTPUT')
  }
  return report
}

export interface MonthlyReportResult {
  report: MonthlyReport
  usage: AiUsageInfo
}

export async function generateMonthlyReport(
  input: MonthlyReportInput
): Promise<MonthlyReportResult> {
  const apiKey = await getOpenAIKey()
  if (!apiKey) throw new OpenAIError('OPENAI_KEY_MISSING')
  const model = await getOpenAIModelForStats()
  const userPrompt = buildMonthlyReportPrompt(input)

  // One retry on malformed JSON, mirroring generateProgram.
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { content, usage } = await callOpenAIJson(
        apiKey,
        model,
        MONTHLY_REPORT_SYSTEM,
        userPrompt,
        MONTHLY_REPORT_MAX_TOKENS
      )
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new OpenAIError('OPENAI_BAD_OUTPUT')
      }
      return { report: normalizeMonthlyReport(parsed), usage }
    } catch (err) {
      lastErr = err
      if (err instanceof OpenAIError && err.code === 'OPENAI_BAD_OUTPUT') continue
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new OpenAIError('OPENAI_BAD_OUTPUT')
}
