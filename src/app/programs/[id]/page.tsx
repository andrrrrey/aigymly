'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, CalendarPlus, Check, Dumbbell, Timer, Sparkles, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { cn, addMinutesToTime, addDaysISO, nextDateForWeekday } from '@/lib/utils';
import type { Program, ProgramBlock, ProgramDay, Workout } from '@/types';

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { questionnaire, addWorkout } = useApp();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Date-picker sheet: dayIndex === 'all' means schedule whole program.
  const [picker, setPicker] = useState<null | { mode: 'single'; day: ProgramDay; idx: number } | { mode: 'all' }>(null);
  const [pickDate, setPickDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<string | null>(null);

  // Regenerate sheet + comment, and delete confirmation sheet.
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenComment, setRegenComment] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/programs/' + params.id)
      .then((res) => {
        if (res.status === 404 || res.status === 401) {
          if (active) setNotFound(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data: Program | null) => {
        if (active && data) setProgram(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const startTime = questionnaire.preferredTime || '18:00';
  const durationMin = questionnaire.sessionDurationMin || 60;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/programs/' + params.id + '/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: regenComment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === 'ANSWERS_MISSING') {
          showToast('Перегенерация недоступна для этой программы');
        } else if (data?.error === 'OPENAI_KEY_MISSING') {
          showToast('Генерация недоступна: не настроен ключ OpenAI');
        } else {
          showToast('Не удалось перегенерировать. Попробуй ещё раз');
        }
        return;
      }
      const updated: Program = await res.json();
      setProgram(updated);
      setRegenOpen(false);
      setRegenComment('');
      showToast('Программа перегенерирована');
    } catch {
      showToast('Ошибка сети. Попробуй снова');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/programs/' + params.id, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Не удалось удалить программу');
        return;
      }
      router.push('/programs');
    } catch {
      showToast('Ошибка сети. Попробуй снова');
    } finally {
      setDeleting(false);
    }
  };

  // Blocks to render/schedule: real mesocycle blocks, or a single legacy block.
  const blocks: ProgramBlock[] =
    program?.blocks && program.blocks.length
      ? program.blocks
      : program
        ? [{ name: 'Программа', weeks: '', days: program.days }]
        : [];
  const isMeso = (program?.blocks?.length ?? 0) > 1;

  const dayToWorkout = (
    day: ProgramDay,
    _idx: number,
    date: string,
    title?: string
  ): Omit<Workout, 'id'> => ({
    title: title ?? day.title,
    date,
    startTime,
    endTime: addMinutesToTime(startTime, durationMin),
    // Same neutral/gray default as a manually-created workout (until rated).
    emoji: 'neutral',
    emojiBg: 'gray',
    marker: 'gray',
    icon: '/img/normal.svg',
    exercises: day.exercises,
    completed: false,
  });

  const confirmPicker = () => {
    if (!picker || !program) return;
    if (picker.mode === 'single') {
      addWorkout(dayToWorkout(picker.day, picker.idx, pickDate));
      showToast('Тренировка добавлена в календарь');
    } else {
      // Block 1 → weeks 1–4, Block 2 → weeks 5–8 (legacy: one cycle).
      const weeksPerBlock = isMeso ? 4 : 1;
      const schedule = computeProgramSchedule(
        pickDate,
        blocks,
        weeksPerBlock,
        questionnaire.preferredDays
      );
      schedule.forEach(({ day, dayIndex, date, weekNumber }) =>
        addWorkout(
          dayToWorkout(
            day,
            dayIndex,
            date,
            isMeso ? `Неделя ${weekNumber} · ${day.title}` : day.title
          )
        )
      );
      showToast(`Запланировано тренировок: ${schedule.length}`);
    }
    setPicker(null);
  };

  if (loading) {
    return (
      <main className="grid flex-1 place-items-center bg-white text-[13px] text-ink-400">
        Загрузка…
      </main>
    );
  }

  if (notFound || !program) {
    return (
      <main className="grid flex-1 place-items-center bg-white px-8 text-center">
        <div>
          <p className="text-[14px] text-ink-500">Программа не найдена</p>
          <button
            onClick={() => router.push('/programs')}
            className="tappable mt-4 rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            К программам
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="shrink-0 bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <button
            onClick={() => router.push('/programs')}
            className="tappable -ml-1.5 flex items-center gap-1 rounded-full bg-ink-100 py-2 pl-2 pr-3.5 text-[14px] font-semibold text-ink-900"
          >
            <ChevronLeft size={18} />
            Программы
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="tappable grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-marker-red/10 hover:text-marker-red"
            aria-label="Удалить программу"
          >
            <Trash2 size={19} />
          </button>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 pb-32 pt-1">
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-ink-900">
          {program.title}
        </h1>
        {program.description && (
          <p className="mt-1.5 text-[14px] leading-snug text-ink-500">{program.description}</p>
        )}

        <button
          onClick={() => setPicker({ mode: 'all' })}
          className="tappable mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-fab"
        >
          <CalendarPlus size={18} />
          Запланировать всю программу
        </button>

        <button
          onClick={() => setRegenOpen(true)}
          className="tappable mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-brand px-5 py-3 text-[15px] font-semibold text-brand"
        >
          <Sparkles size={18} />
          Перегенерировать программу
        </button>

        {program.analysis && (
          <div className="mt-6 space-y-2.5">
            {program.analysis.profile && (
              <AnalysisCard title="Анализ профиля" text={program.analysis.profile} />
            )}
            {program.analysis.strategy && (
              <AnalysisCard title="Стратегия под цели" text={program.analysis.strategy} />
            )}
            {program.analysis.recommendations && (
              <AnalysisCard title="Рекомендации" text={program.analysis.recommendations} />
            )}
          </div>
        )}

        {blocks.map((block, bi) => (
          <div key={bi} className="mt-6">
            {(block.name || block.weeks) && (
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">
                  {block.name}
                </h2>
                {block.weeks && (
                  <span className="text-[13px] text-ink-400">{block.weeks}</span>
                )}
              </div>
            )}
            <div className="space-y-3">
              {block.days.map((day, idx) => (
                <DayCard
                  key={day.id}
                  day={day}
                  onAdd={() => {
                    setPickDate(new Date().toISOString().slice(0, 10));
                    setPicker({ mode: 'single', day, idx });
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5"
          >
            <div className="flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-elevated">
              <Check size={16} />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date picker sheet */}
      <AnimatePresence>
        {picker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPicker(null)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
              <h3 className="text-[17px] font-semibold text-ink-900">
                {picker.mode === 'single'
                  ? 'Добавить в календарь'
                  : 'Запланировать всю программу'}
              </h3>
              <p className="mt-1 text-[13px] text-ink-500">
                {picker.mode === 'single'
                  ? 'Выбери дату тренировки'
                  : questionnaire.preferredDays?.length
                    ? 'Тренировки разложатся по удобным дням недели начиная с выбранной даты'
                    : 'Тренировки добавятся через день начиная с выбранной даты'}
              </p>
              <div className="mt-4 rounded-2xl border border-ink-100 p-4">
                <div className="mb-2 text-[13px] text-ink-500">
                  {picker.mode === 'single' ? 'Дата' : 'Начать с'}
                </div>
                <input
                  type="date"
                  value={pickDate}
                  onChange={(e) => setPickDate(e.target.value)}
                  className="tabular w-full bg-transparent text-[18px] font-semibold text-ink-900 focus:outline-none"
                />
              </div>
              <button
                onClick={confirmPicker}
                className="tappable mt-4 w-full rounded-full bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-fab"
              >
                {picker.mode === 'single' ? 'Добавить' : 'Запланировать'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Regenerate sheet */}
      <AnimatePresence>
        {regenOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !regenerating && setRegenOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
              <h3 className="text-[17px] font-semibold text-ink-900">Перегенерировать программу</h3>
              <p className="mt-1 text-[13px] text-ink-500">
                Опиши, что изменить — AI пересоберёт программу с учётом твоего комментария.
                Уже добавленные в календарь тренировки останутся.
              </p>
              <textarea
                value={regenComment}
                onChange={(e) => setRegenComment(e.target.value)}
                rows={4}
                placeholder="Например: меньше кардио, больше упражнений на спину, заменить приседания со штангой…"
                className="mt-4 w-full resize-none rounded-2xl border border-ink-100 p-4 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none"
              />
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="tappable mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-fab disabled:opacity-60"
              >
                {regenerating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      <Sparkles size={18} />
                    </motion.span>
                    AI пересобирает программу…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Перегенерировать
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation sheet */}
      <AnimatePresence>
        {deleteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
              <h3 className="text-[17px] font-semibold text-ink-900">Удалить программу?</h3>
              <p className="mt-1 text-[13px] text-ink-500">
                Программа будет удалена безвозвратно. Уже добавленные в календарь тренировки останутся.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="tappable mt-4 w-full rounded-full bg-marker-red px-5 py-3.5 text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Удаление…' : 'Удалить программу'}
              </button>
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="tappable mt-2 w-full rounded-full px-5 py-3 text-[15px] font-semibold text-ink-500"
              >
                Отмена
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DayCard({ day, onAdd }: { day: ProgramDay; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tappable flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink-900">{day.title}</div>
          <div className="mt-0.5 text-[12px] text-ink-400">
            {day.focus ? day.focus + ' · ' : ''}
            {day.exercises.length} упр.
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-1.5 px-4 pb-3">
              {day.exercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2.5 py-1">
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                      ex.kind === 'cardio'
                        ? 'bg-marker-cyan/10 text-marker-cyan'
                        : 'bg-brand/10 text-brand'
                    )}
                  >
                    {ex.kind === 'cardio' ? <Timer size={15} /> : <Dumbbell size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-ink-900">{ex.name}</div>
                    <div className="text-[12px] text-ink-400">
                      {ex.kind === 'cardio'
                        ? formatCardio(ex.durationSec, ex.distanceM)
                        : `${ex.sets?.length ?? 0} × ${ex.sets?.[0]?.reps ?? 0}` +
                          (ex.sets?.[0]?.weightKg ? ` · ${ex.sets[0].weightKg} кг` : '')}
                    </div>
                  </div>
                </div>
              ))}
              {day.notes && (
                <p className="pt-1 text-[12px] italic text-ink-400">{day.notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-ink-50 p-2.5">
        <button
          onClick={onAdd}
          className="tappable flex w-full items-center justify-center gap-2 rounded-xl bg-ink-50 py-2.5 text-[14px] font-semibold text-brand"
        >
          <CalendarPlus size={16} />
          Добавить в календарь
        </button>
      </div>
    </div>
  );
}

function AnalysisCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
      <h3 className="text-[14px] font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-600">
        {text}
      </p>
    </div>
  );
}

function formatCardio(durationSec?: number, distanceM?: number): string {
  const parts: string[] = [];
  if (durationSec) parts.push(`${Math.round(durationSec / 60)} мин`);
  if (distanceM) parts.push(`${(distanceM / 1000).toFixed(1)} км`);
  return parts.join(' · ') || 'кардио';
}

interface ScheduledDay {
  day: ProgramDay;
  dayIndex: number;
  date: string;
  weekNumber: number;
  blockIndex: number;
}

// Lays the program across the calendar: each block's weekly split repeated for
// `weeksPerBlock` weeks (Block 1 → weeks 1–4, Block 2 → weeks 5–8).
// With preferred weekdays: cycles through them; without: spaces every other day.
function computeProgramSchedule(
  startISO: string,
  blocks: ProgramBlock[],
  weeksPerBlock: number,
  preferredDays?: number[]
): ScheduledDay[] {
  const pdays = (preferredDays ?? []).slice().sort((a, b) => a - b);
  const out: ScheduledDay[] = [];
  let cursor = startISO;
  let weekNumber = 0;
  blocks.forEach((block, blockIndex) => {
    for (let w = 0; w < weeksPerBlock; w++) {
      weekNumber++;
      block.days.forEach((day, dayIndex) => {
        let date: string;
        if (pdays.length) {
          const wd = pdays[dayIndex % pdays.length];
          date = nextDateForWeekday(cursor, wd);
          cursor = addDaysISO(date, 1);
        } else {
          date = cursor;
          cursor = addDaysISO(cursor, 2);
        }
        out.push({ day, dayIndex, date, weekNumber, blockIndex });
      });
    }
  });
  return out;
}
