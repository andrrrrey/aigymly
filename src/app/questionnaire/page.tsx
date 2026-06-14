'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { cn } from '@/lib/utils';
import type {
  BodyShape,
  Equipment,
  Experience,
  FitnessGoal,
  MenstrualPhase,
  Nutrition,
  Occupation,
  Sex,
  Sleep,
  WorkoutPlace,
} from '@/types';

type Step =
  | 'profile'
  | 'goals'
  | 'health'
  | 'place'
  | 'equipment'
  | 'frequency'
  | 'experience'
  | 'duration'
  | 'female'
  | 'lifestyle'
  | 'summary';

function buildSteps(sex?: Sex): Step[] {
  const steps: Step[] = [
    'profile',
    'goals',
    'health',
    'place',
    'equipment',
    'frequency',
    'experience',
    'duration',
  ];
  if (sex === 'female') steps.push('female');
  steps.push('lifestyle', 'summary');
  return steps;
}

const GOALS: { id: FitnessGoal; label: string; desc: string; icon: string }[] = [
  { id: 'lose_weight', label: 'Похудение', desc: 'Сжечь жир, снизить вес', icon: '🔥' },
  { id: 'gain_muscle', label: 'Набор мышечной массы', desc: 'Гипертрофия, рост мышц', icon: '💪' },
  { id: 'tone', label: 'Тонус и рельеф', desc: 'Подтянутость, прорисовка', icon: '✨' },
  { id: 'strength_endurance', label: 'Сила и выносливость', desc: 'Большие веса, работоспособность', icon: '🏋️' },
  { id: 'rehab', label: 'Реабилитация и ЛФК', desc: 'Восстановление, безопасность', icon: '🩹' },
  { id: 'functional', label: 'Функциональная подготовка', desc: 'Баланс, координация, мобильность', icon: '🤸' },
  { id: 'general_health', label: 'Общее здоровье', desc: 'Самочувствие, осанка, ССС', icon: '❤️' },
];

const PLACES: { id: WorkoutPlace; label: string; icon: string }[] = [
  { id: 'home', label: 'Дом', icon: '🏠' },
  { id: 'outdoor', label: 'Уличная площадка', icon: '🌳' },
  { id: 'gym', label: 'Тренажёрный зал', icon: '🏋️' },
];

const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: 'none_mat', label: 'Ничего, только коврик' },
  { id: 'dumbbells', label: 'Гантели' },
  { id: 'barbell', label: 'Штанга и блины' },
  { id: 'bands', label: 'Резиновые петли, эспандеры' },
  { id: 'pullup_bar', label: 'Турник' },
  { id: 'parallel_bars', label: 'Брусья' },
  { id: 'kettlebell', label: 'Гиря' },
  { id: 'fitball', label: 'Фитбол' },
  { id: 'jump_rope', label: 'Скакалка' },
  { id: 'treadmill', label: 'Беговая дорожка' },
  { id: 'bike', label: 'Велотренажёр' },
  { id: 'elliptical', label: 'Эллиптический тренажёр' },
  { id: 'step', label: 'Степ-платформа' },
  { id: 'full_gym', label: 'Полный зал' },
];

const EXPERIENCES: { id: Experience; label: string; desc: string }[] = [
  { id: 'never', label: 'Никогда не тренировался', desc: 'Старт с нуля' },
  { id: 'beginner', label: 'Новичок', desc: 'Менее 6 месяцев' },
  { id: 'intermediate', label: 'Средний', desc: '6–18 месяцев' },
  { id: 'advanced', label: 'Продвинутый', desc: 'Более 1.5 лет' },
];

const DURATIONS = [20, 30, 45, 60, 90, 120];

const MENSTRUAL: { id: MenstrualPhase; label: string }[] = [
  { id: 'skip', label: 'Не хочу указывать' },
  { id: 'not_tracking', label: 'Не отслеживаю' },
  { id: 'menstruation', label: 'Менструация (1–5 день)' },
  { id: 'follicular', label: 'Фолликулярная фаза (6–14 день)' },
  { id: 'ovulation', label: 'Овуляция (около 14 дня)' },
  { id: 'luteal', label: 'Лютеиновая фаза (15–28 день)' },
];

const BODY_SHAPES: { id: BodyShape; label: string }[] = [
  { id: 'pear', label: 'Груша' },
  { id: 'apple', label: 'Яблоко' },
  { id: 'rectangle', label: 'Прямоугольник' },
  { id: 'hourglass', label: 'Песочные часы' },
];

const OCCUPATIONS: { id: Occupation; label: string }[] = [
  { id: 'sedentary', label: 'Сидячая работа' },
  { id: 'on_feet', label: 'На ногах весь день' },
  { id: 'physical', label: 'Физический труд' },
  { id: 'mixed', label: 'Смешанный тип' },
];

const SLEEPS: { id: Sleep; label: string }[] = [
  { id: 'lt6', label: 'Менее 6 часов' },
  { id: '6to7', label: '6–7 часов' },
  { id: '7to8', label: '7–8 часов' },
  { id: 'gt8', label: 'Более 8 часов' },
];

const NUTRITIONS: { id: Nutrition; label: string }[] = [
  { id: 'not_tracking', label: 'Не слежу' },
  { id: 'intuitive', label: 'Питаюсь интуитивно' },
  { id: 'counting', label: 'Считаю калории' },
  { id: 'specific', label: 'Специфическая диета' },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const { questionnaire } = useApp();
  const user = useAuth((s) => s.user);
  const [stepIdx, setStepIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const STEPS = buildSteps(questionnaire.sex);
  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1);
  };
  const back = () => {
    if (stepIdx === 0) router.back();
    else setStepIdx((i) => i - 1);
  };

  const handleGenerate = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionnaire),
      });
      if (res.status === 401) {
        setAuthOpen(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === 'OPENAI_KEY_MISSING') {
          setError('Генерация недоступна: администратор ещё не настроил ключ OpenAI.');
        } else {
          setError('Не удалось собрать программу. Попробуй ещё раз.');
        }
        return;
      }
      const program = await res.json();
      router.push('/programs/' + program.id);
    } catch {
      setError('Ошибка сети. Проверь соединение и попробуй снова.');
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = (() => {
    switch (step) {
      case 'profile':
        return (
          !!questionnaire.sex &&
          !!questionnaire.age &&
          !!questionnaire.heightCm &&
          !!questionnaire.weightKg
        );
      case 'goals':
        return (questionnaire.goals?.length ?? 0) > 0;
      case 'place':
        return !!questionnaire.place;
      case 'equipment':
        return (questionnaire.equipment?.length ?? 0) > 0;
      case 'frequency':
        return !!questionnaire.sessionsPerWeek;
      case 'experience':
        return !!questionnaire.experience;
      case 'duration':
        return !!questionnaire.sessionDurationMin;
      case 'health':
      case 'female':
      case 'lifestyle':
        return true;
      default:
        return true;
    }
  })();

  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={back}
            className="tappable -ml-2 grid h-9 w-9 place-items-center rounded-full text-ink-900"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="tabular text-[13px] font-medium text-ink-400">
            {stepIdx + 1} из {STEPS.length}
          </span>
          <div className="w-9" />
        </div>
        <div className="px-5 pb-4">
          <div className="h-1 overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full rounded-full bg-brand"
              animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white">
        <div className="px-5 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 'profile' && <ProfileStep />}
              {step === 'goals' && <GoalsStep />}
              {step === 'health' && <HealthStep />}
              {step === 'place' && <PlaceStep />}
              {step === 'equipment' && <EquipmentStep />}
              {step === 'frequency' && <FrequencyStep />}
              {step === 'experience' && <ExperienceStep />}
              {step === 'duration' && <DurationStep />}
              {step === 'female' && <FemaleStep />}
              {step === 'lifestyle' && <LifestyleStep />}
              {step === 'summary' && <SummaryStep />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div
        className="shrink-0 border-t border-ink-100 bg-white px-5 py-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        {error && (
          <p className="mb-2.5 text-center text-[13px] text-marker-red">{error}</p>
        )}
        {step === 'summary' ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="tappable flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-fab disabled:opacity-60"
          >
            {generating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Sparkles size={18} />
                </motion.span>
                AI собирает программу…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Сгенерировать программу
              </>
            )}
          </button>
        ) : (
          <button
            onClick={next}
            disabled={!canProceed}
            className={cn(
              'tappable w-full rounded-full px-5 py-3.5 text-[15px] font-semibold transition-colors',
              canProceed
                ? 'bg-brand text-white shadow-fab'
                : 'bg-ink-100 text-ink-400'
            )}
          >
            Дальше
          </button>
        )}
      </div>

      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

// ============= STEPS =============

function StepHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6 mt-2">
      <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-ink-900">
        {title}
      </h2>
      {hint && <p className="mt-1.5 text-[14px] text-ink-500">{hint}</p>}
    </div>
  );
}

function ProfileStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Базовый профиль" hint="Пол, возраст, рост и вес для расчёта нагрузки" />
      <div className="space-y-3">
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Пол</div>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateQuestionnaire({ sex: s })}
                className={cn(
                  'tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium',
                  questionnaire.sex === s ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
                )}
              >
                {s === 'male' ? 'Мужской' : 'Женский'}
              </button>
            ))}
          </div>
        </div>
        <FieldInput
          label="Возраст"
          unit="лет"
          value={questionnaire.age ?? ''}
          onChange={(v) => updateQuestionnaire({ age: v })}
        />
        <FieldInput
          label="Рост"
          unit="см"
          value={questionnaire.heightCm ?? ''}
          onChange={(v) => updateQuestionnaire({ heightCm: v })}
        />
        <FieldInput
          label="Вес"
          unit="кг"
          value={questionnaire.weightKg ?? ''}
          onChange={(v) => updateQuestionnaire({ weightKg: v })}
        />
      </div>
    </>
  );
}

function GoalsStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  const goals = questionnaire.goals ?? [];
  const toggle = (id: FitnessGoal) => {
    const next = goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id];
    updateQuestionnaire({ goals: next });
  };
  return (
    <>
      <StepHeader
        title="Какие у тебя цели?"
        hint="Можно выбрать несколько. Первая выбранная — основная."
      />
      <div className="space-y-2">
        {GOALS.map((g) => {
          const idx = goals.indexOf(g.id);
          const active = idx >= 0;
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={cn(
                'tappable flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                active ? 'border-brand bg-brand/5' : 'border-ink-100 bg-white'
              )}
            >
              <span className="text-[22px]">{g.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-ink-900">{g.label}</div>
                <div className="text-[13px] text-ink-500">{g.desc}</div>
              </div>
              {idx === 0 && (
                <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                  Основная
                </span>
              )}
              <CheckBox active={active} />
            </button>
          );
        })}
      </div>
    </>
  );
}

function HealthStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader
        title="Здоровье и ограничения"
        hint="AI учтёт это и подберёт безопасные движения. Любое поле можно пропустить."
      />
      <div className="space-y-3">
        <HealthField
          label="Хронические заболевания"
          placeholder="Например: гипертония 1 степени, остеохондроз поясничного отдела. Если нет — «Здоров(а)»."
          value={questionnaire.chronicConditions ?? ''}
          onChange={(v) => updateQuestionnaire({ chronicConditions: v })}
        />
        <HealthField
          label="Травмы и операции в прошлом"
          placeholder="Например: разрыв ПКС правого колена, операция 2 года назад. Укажи давность."
          value={questionnaire.pastInjuries ?? ''}
          onChange={(v) => updateQuestionnaire({ pastInjuries: v })}
        />
        <HealthField
          label="Текущие жалобы и боли"
          placeholder="Что беспокоит сейчас? Например: ноет поясница после сидения, хрустит плечо."
          value={questionnaire.currentComplaints ?? ''}
          onChange={(v) => updateQuestionnaire({ currentComplaints: v })}
        />
        <HealthField
          label="Противопоказания от врача"
          placeholder="Если врач что-то запретил. Например: запрещена осевая нагрузка, исключён бег."
          value={questionnaire.medicalRestrictions ?? ''}
          onChange={(v) => updateQuestionnaire({ medicalRestrictions: v })}
        />
      </div>
    </>
  );
}

function PlaceStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Где ты тренируешься?" />
      <div className="grid grid-cols-1 gap-2">
        {PLACES.map((l) => (
          <button
            key={l.id}
            onClick={() => updateQuestionnaire({ place: l.id })}
            className={cn(
              'tappable flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
              questionnaire.place === l.id ? 'border-brand bg-brand/5' : 'border-ink-100 bg-white'
            )}
          >
            <span className="text-[26px]">{l.icon}</span>
            <span className="text-[15px] font-semibold text-ink-900">{l.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function EquipmentStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  const selected = new Set(questionnaire.equipment ?? []);
  const toggle = (id: Equipment) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateQuestionnaire({ equipment: Array.from(next) });
  };
  return (
    <>
      <StepHeader title="Доступное оборудование" hint="Выбери всё, к чему есть доступ" />
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT.map((e) => (
          <button
            key={e.id}
            onClick={() => toggle(e.id)}
            className={cn(
              'tappable rounded-2xl border p-3.5 text-left transition-colors',
              selected.has(e.id) ? 'border-brand bg-brand/5' : 'border-ink-100 bg-white'
            )}
          >
            <span className="text-[14px] font-semibold text-ink-900">{e.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function FrequencyStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Сколько тренировок в неделю?" />
      <div className="rounded-2xl border border-ink-100 p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => updateQuestionnaire({ sessionsPerWeek: n })}
              className={cn(
                'tappable tabular grid h-11 place-items-center rounded-xl text-[15px] font-semibold',
                questionnaire.sessionsPerWeek === n
                  ? 'bg-brand text-white'
                  : 'bg-ink-100 text-ink-700'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function ExperienceStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Твой уровень подготовки?" hint="Это поможет подобрать правильную нагрузку" />
      <div className="space-y-2">
        {EXPERIENCES.map((e) => (
          <button
            key={e.id}
            onClick={() => updateQuestionnaire({ experience: e.id })}
            className={cn(
              'tappable flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
              questionnaire.experience === e.id ? 'border-brand bg-brand/5' : 'border-ink-100 bg-white'
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink-900">{e.label}</div>
              <div className="text-[13px] text-ink-500">{e.desc}</div>
            </div>
            <RadioDot active={questionnaire.experience === e.id} />
          </button>
        ))}
      </div>
    </>
  );
}

function DurationStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Сколько времени на тренировку?" />
      <div className="rounded-2xl border border-ink-100 p-4">
        <div className="grid grid-cols-3 gap-1.5">
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => updateQuestionnaire({ sessionDurationMin: m })}
              className={cn(
                'tappable rounded-xl py-2.5 text-[14px] font-semibold',
                questionnaire.sessionDurationMin === m
                  ? 'bg-brand text-white'
                  : 'bg-ink-100 text-ink-700'
              )}
            >
              {m} мин
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function FemaleStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader
        title="Женская физиология"
        hint="Поможет точнее настроить интенсивность под цикл и особенности"
      />
      <div className="space-y-4">
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Беременность</div>
          <div className="flex gap-2">
            {(['no', 'yes'] as const).map((p) => (
              <button
                key={p}
                onClick={() => updateQuestionnaire({ pregnancy: p })}
                className={cn(
                  'tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium',
                  questionnaire.pregnancy === p ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
                )}
              >
                {p === 'no' ? 'Нет' : 'Да'}
              </button>
            ))}
          </div>
          {questionnaire.pregnancy === 'yes' && (
            <div className="mt-3">
              <FieldInput
                label="Срок"
                unit="нед."
                value={questionnaire.pregnancyWeeks ?? ''}
                onChange={(v) => updateQuestionnaire({ pregnancyWeeks: v })}
              />
            </div>
          )}
        </div>

        <SelectCard
          label="Менструальный цикл"
          options={MENSTRUAL}
          value={questionnaire.menstrualPhase}
          onChange={(v) => updateQuestionnaire({ menstrualPhase: v })}
        />

        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Менопауза</div>
          <YesNo
            value={questionnaire.menopause}
            onChange={(v) => updateQuestionnaire({ menopause: v })}
          />
        </div>

        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Болезненные менструации</div>
          <YesNo
            value={questionnaire.painfulPeriods}
            onChange={(v) => updateQuestionnaire({ painfulPeriods: v })}
          />
        </div>

        <SelectCard
          label="Тип фигуры (опционально)"
          options={BODY_SHAPES}
          value={questionnaire.bodyShape}
          onChange={(v) => updateQuestionnaire({ bodyShape: v })}
        />
      </div>
    </>
  );
}

function LifestyleStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Образ жизни и восстановление" hint="Опционально, но повышает точность" />
      <div className="space-y-4">
        <SelectCard
          label="Род деятельности"
          options={OCCUPATIONS}
          value={questionnaire.occupation}
          onChange={(v) => updateQuestionnaire({ occupation: v })}
        />
        <SelectCard
          label="Сон"
          options={SLEEPS}
          value={questionnaire.sleep}
          onChange={(v) => updateQuestionnaire({ sleep: v })}
        />
        <SelectCard
          label="Питание"
          options={NUTRITIONS}
          value={questionnaire.nutrition}
          onChange={(v) => updateQuestionnaire({ nutrition: v })}
        />
        {questionnaire.nutrition === 'specific' && (
          <textarea
            value={questionnaire.nutritionDiet ?? ''}
            onChange={(e) => updateQuestionnaire({ nutritionDiet: e.target.value })}
            rows={2}
            placeholder="Какая диета? Например: кето, веганство, интервальное голодание…"
            className="w-full resize-none rounded-2xl border border-ink-100 p-4 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none"
          />
        )}
      </div>
    </>
  );
}

function SummaryStep() {
  const { questionnaire: q } = useApp();
  return (
    <>
      <StepHeader title="Готово!" hint="Проверь ответы и запусти генерацию программы на 8 недель" />
      <div className="space-y-1.5 rounded-2xl border border-ink-100 bg-ink-50 p-4">
        <SummaryRow
          label="Профиль"
          value={
            q.sex
              ? `${q.sex === 'female' ? 'Жен' : 'Муж'}, ${q.age} лет, ${q.heightCm} см, ${q.weightKg} кг`
              : undefined
          }
        />
        <SummaryRow
          label="Цели"
          value={
            q.goals?.length
              ? q.goals.map((id) => GOALS.find((g) => g.id === id)?.label).filter(Boolean).join(', ')
              : undefined
          }
        />
        <SummaryRow label="Где" value={PLACES.find((l) => l.id === q.place)?.label} />
        <SummaryRow
          label="Оборудование"
          value={
            q.equipment?.length
              ? q.equipment.map((id) => EQUIPMENT.find((e) => e.id === id)?.label).filter(Boolean).join(', ')
              : undefined
          }
        />
        <SummaryRow
          label="Частота"
          value={
            q.sessionsPerWeek
              ? `${q.sessionsPerWeek} раз в неделю · ${q.sessionDurationMin} мин`
              : undefined
          }
        />
        <SummaryRow label="Уровень" value={EXPERIENCES.find((e) => e.id === q.experience)?.label} />
        {q.chronicConditions ? <SummaryRow label="Заболевания" value={q.chronicConditions} /> : null}
        {q.pastInjuries ? <SummaryRow label="Травмы" value={q.pastInjuries} /> : null}
        {q.currentComplaints ? <SummaryRow label="Жалобы" value={q.currentComplaints} /> : null}
        {q.medicalRestrictions ? <SummaryRow label="Противопоказания" value={q.medicalRestrictions} /> : null}
      </div>
    </>
  );
}

// ============= shared =============

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[13px] text-ink-500">{label}</span>
      <span className="max-w-[62%] text-right text-[14px] font-medium text-ink-900">
        {value ?? '—'}
      </span>
    </div>
  );
}

function FieldInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | '';
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="mb-2 text-[13px] text-ink-500">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(v);
            else if (e.target.value === '') onChange(0);
          }}
          placeholder="0"
          className="tabular min-w-0 flex-1 bg-transparent text-[20px] font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none"
        />
        <span className="text-[14px] text-ink-400">{unit}</span>
      </div>
    </div>
  );
}

function HealthField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 px-1 text-[13px] font-medium text-ink-700">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-ink-100 p-4 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none"
      />
    </div>
  );
}

function SelectCard<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="mb-2.5 text-[13px] text-ink-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'tappable rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors',
              value === o.id ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value?: 'yes' | 'no';
  onChange: (v: 'yes' | 'no') => void;
}) {
  return (
    <div className="flex gap-2">
      {(['no', 'yes'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium',
            value === v ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
          )}
        >
          {v === 'no' ? 'Нет' : 'Да'}
        </button>
      ))}
    </div>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
        active ? 'border-brand' : 'border-ink-200'
      )}
    >
      {active && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
    </div>
  );
}

function CheckBox({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors',
        active ? 'border-brand bg-brand text-white' : 'border-ink-200'
      )}
    >
      {active && (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 7l3 3 5-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
