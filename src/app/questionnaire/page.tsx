'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { cn } from '@/lib/utils';
import type { Equipment, Experience, FitnessGoal, Location } from '@/types';

const STEPS = [
  'goal',
  'experience',
  'biometrics',
  'frequency',
  'location',
  'equipment',
  'muscles',
  'injuries',
  'preferences',
  'summary',
] as const;
type Step = (typeof STEPS)[number];

const GOALS: { id: FitnessGoal; label: string; desc: string; icon: string }[] = [
  { id: 'lose_weight', label: 'Похудение', desc: 'Сжечь жир, снизить вес', icon: '🔥' },
  { id: 'gain_muscle', label: 'Набор массы', desc: 'Гипертрофия, рост мышц', icon: '💪' },
  { id: 'maintain', label: 'Поддержание формы', desc: 'Сохранить текущий результат', icon: '⚖️' },
  { id: 'endurance', label: 'Выносливость', desc: 'Кардио, циклика', icon: '🏃' },
  { id: 'mobility', label: 'Мобильность', desc: 'Гибкость, подвижность', icon: '🤸' },
  { id: 'rehab', label: 'Реабилитация', desc: 'Восстановление после травмы', icon: '🩹' },
];

const EXPERIENCES: { id: Experience; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Новичок', desc: 'Менее 6 месяцев тренировок' },
  { id: 'intermediate', label: 'Средний', desc: '6 месяцев — 2 года стажа' },
  { id: 'advanced', label: 'Продвинутый', desc: 'Более 2 лет регулярных тренировок' },
];

const LOCATIONS: { id: Location; label: string; icon: string }[] = [
  { id: 'gym', label: 'Зал', icon: '🏋️' },
  { id: 'home', label: 'Дом', icon: '🏠' },
  { id: 'outdoor', label: 'Улица', icon: '🌳' },
  { id: 'mixed', label: 'По-разному', icon: '🔀' },
];

const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Штанга' },
  { id: 'dumbbells', label: 'Гантели' },
  { id: 'machines', label: 'Тренажёры' },
  { id: 'bands', label: 'Резинки' },
  { id: 'pullup_bar', label: 'Турник' },
  { id: 'bodyweight_only', label: 'Только своё тело' },
  { id: 'cardio_machines', label: 'Кардиотренажёры' },
];

const MUSCLES = ['Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Ягодицы'];

export default function QuestionnairePage() {
  const router = useRouter();
  const { questionnaire, updateQuestionnaire } = useApp();
  const user = useAuth((s) => s.user);
  const [stepIdx, setStepIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const step = STEPS[stepIdx];

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
      case 'goal':
        return !!questionnaire.goal;
      case 'experience':
        return !!questionnaire.experience;
      case 'biometrics':
        return !!questionnaire.age && !!questionnaire.weightKg && !!questionnaire.heightCm;
      case 'frequency':
        return !!questionnaire.sessionsPerWeek && !!questionnaire.sessionDurationMin;
      case 'location':
        return !!questionnaire.location;
      case 'equipment':
        return (questionnaire.equipment?.length ?? 0) > 0;
      case 'muscles':
        return true;
      case 'injuries':
        return true;
      case 'preferences':
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
              {step === 'goal' && <GoalStep />}
              {step === 'experience' && <ExperienceStep />}
              {step === 'biometrics' && <BiometricsStep />}
              {step === 'frequency' && <FrequencyStep />}
              {step === 'location' && <LocationStep />}
              {step === 'equipment' && <EquipmentStep />}
              {step === 'muscles' && <MusclesStep />}
              {step === 'injuries' && <InjuriesStep />}
              {step === 'preferences' && <PreferencesStep />}
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

function GoalStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader
        title="Какая твоя цель?"
        hint="Выбери одну — на её основе AI соберёт программу"
      />
      <div className="space-y-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => updateQuestionnaire({ goal: g.id })}
            className={cn(
              'tappable flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
              questionnaire.goal === g.id
                ? 'border-brand bg-brand/5'
                : 'border-ink-100 bg-white'
            )}
          >
            <span className="text-[22px]">{g.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink-900">{g.label}</div>
              <div className="text-[13px] text-ink-500">{g.desc}</div>
            </div>
            <RadioDot active={questionnaire.goal === g.id} />
          </button>
        ))}
      </div>
    </>
  );
}

function ExperienceStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader
        title="Твой уровень подготовки?"
        hint="Это поможет подобрать правильную нагрузку"
      />
      <div className="space-y-2">
        {EXPERIENCES.map((e) => (
          <button
            key={e.id}
            onClick={() => updateQuestionnaire({ experience: e.id })}
            className={cn(
              'tappable flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
              questionnaire.experience === e.id
                ? 'border-brand bg-brand/5'
                : 'border-ink-100 bg-white'
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

function BiometricsStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Расскажи о себе" hint="Возраст, рост и вес для расчёта нагрузки" />
      <div className="space-y-3">
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
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Пол</div>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateQuestionnaire({ sex: s })}
                className={cn(
                  'tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium',
                  questionnaire.sex === s
                    ? 'bg-brand text-white'
                    : 'bg-ink-100 text-ink-700'
                )}
              >
                {s === 'male' ? 'Муж' : s === 'female' ? 'Жен' : 'Другое'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function FrequencyStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Как часто и как долго?" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-3 text-[13px] text-ink-500">Тренировок в неделю</div>
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
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-3 text-[13px] text-ink-500">Длительность тренировки</div>
          <div className="grid grid-cols-4 gap-1.5">
            {([30, 45, 60, 90] as const).map((m) => (
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
      </div>
    </>
  );
}

function LocationStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader title="Где ты тренируешься?" />
      <div className="grid grid-cols-2 gap-2">
        {LOCATIONS.map((l) => (
          <button
            key={l.id}
            onClick={() => updateQuestionnaire({ location: l.id })}
            className={cn(
              'tappable flex flex-col items-center gap-2 rounded-2xl border p-5 transition-colors',
              questionnaire.location === l.id
                ? 'border-brand bg-brand/5'
                : 'border-ink-100 bg-white'
            )}
          >
            <span className="text-[32px]">{l.icon}</span>
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
      <StepHeader
        title="Доступное оборудование"
        hint="Выбери всё, к чему есть доступ"
      />
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT.map((e) => (
          <button
            key={e.id}
            onClick={() => toggle(e.id)}
            className={cn(
              'tappable rounded-2xl border p-3.5 text-left transition-colors',
              selected.has(e.id)
                ? 'border-brand bg-brand/5'
                : 'border-ink-100 bg-white'
            )}
          >
            <span className="text-[14px] font-semibold text-ink-900">{e.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MusclesStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  const selected = new Set(questionnaire.priorityMuscles ?? []);
  const toggle = (m: string) => {
    const next = new Set(selected);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    updateQuestionnaire({ priorityMuscles: Array.from(next) });
  };
  return (
    <>
      <StepHeader
        title="Приоритетные группы мышц"
        hint="Над чем хочешь поработать сильнее? Можно пропустить."
      />
      <div className="flex flex-wrap gap-2">
        {MUSCLES.map((m) => (
          <button
            key={m}
            onClick={() => toggle(m)}
            className={cn(
              'tappable rounded-full px-4 py-2 text-[14px] font-medium transition-colors',
              selected.has(m)
                ? 'bg-brand text-white'
                : 'bg-ink-100 text-ink-700'
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </>
  );
}

function InjuriesStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  return (
    <>
      <StepHeader
        title="Травмы и ограничения"
        hint="AI учтёт это и исключит опасные движения. Можно пропустить."
      />
      <textarea
        value={questionnaire.injuries ?? ''}
        onChange={(e) => updateQuestionnaire({ injuries: e.target.value })}
        rows={5}
        placeholder="Например: проблемы с поясницей, операция на колене 2 года назад…"
        className="w-full resize-none rounded-2xl border border-ink-100 p-4 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none"
      />
    </>
  );
}

function PreferencesStep() {
  const { questionnaire, updateQuestionnaire } = useApp();
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const selected = new Set(questionnaire.preferredDays ?? []);
  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    updateQuestionnaire({ preferredDays: Array.from(next) });
  };
  return (
    <>
      <StepHeader title="Предпочтения по расписанию" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-3 text-[13px] text-ink-500">Удобные дни недели</div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={cn(
                  'tappable grid h-11 place-items-center rounded-xl text-[13px] font-semibold',
                  selected.has(i) ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="mb-2 text-[13px] text-ink-500">Удобное время</div>
          <input
            type="time"
            value={questionnaire.preferredTime ?? '18:00'}
            onChange={(e) => updateQuestionnaire({ preferredTime: e.target.value })}
            className="tabular w-full rounded-xl bg-ink-100 px-3 py-2.5 text-[15px] font-medium text-ink-900 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}

function SummaryStep() {
  const { questionnaire } = useApp();
  const goal = GOALS.find((g) => g.id === questionnaire.goal);
  return (
    <>
      <StepHeader
        title="Готово!"
        hint="Проверь свои ответы и запусти генерацию программы"
      />
      <div className="space-y-1.5 rounded-2xl border border-ink-100 bg-ink-50 p-4">
        <SummaryRow label="Цель" value={goal?.label} />
        <SummaryRow label="Уровень" value={EXPERIENCES.find((e) => e.id === questionnaire.experience)?.label} />
        <SummaryRow
          label="Параметры"
          value={
            questionnaire.age
              ? `${questionnaire.age} лет, ${questionnaire.heightCm} см, ${questionnaire.weightKg} кг`
              : undefined
          }
        />
        <SummaryRow
          label="Частота"
          value={
            questionnaire.sessionsPerWeek
              ? `${questionnaire.sessionsPerWeek} раз в неделю · ${questionnaire.sessionDurationMin} мин`
              : undefined
          }
        />
        <SummaryRow
          label="Где"
          value={LOCATIONS.find((l) => l.id === questionnaire.location)?.label}
        />
        <SummaryRow
          label="Оборудование"
          value={
            questionnaire.equipment?.length
              ? questionnaire.equipment
                  .map((id) => EQUIPMENT.find((e) => e.id === id)?.label)
                  .filter(Boolean)
                  .join(', ')
              : undefined
          }
        />
        {questionnaire.priorityMuscles?.length ? (
          <SummaryRow label="Фокус" value={questionnaire.priorityMuscles.join(', ')} />
        ) : null}
        {questionnaire.injuries ? (
          <SummaryRow label="Ограничения" value={questionnaire.injuries} />
        ) : null}
      </div>
    </>
  );
}

// ============= shared =============

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[13px] text-ink-500">{label}</span>
      <span className="max-w-[60%] text-right text-[14px] font-medium text-ink-900">
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
          }}
          placeholder="0"
          className="tabular min-w-0 flex-1 bg-transparent text-[20px] font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none"
        />
        <span className="text-[14px] text-ink-400">{unit}</span>
      </div>
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
