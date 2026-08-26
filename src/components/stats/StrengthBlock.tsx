'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, formatDecimalRu, pluralRu } from '@/lib/utils';
import type { MonthStats, StrengthProgress } from '@/lib/statsMonth';
import { StatsSection, EmptyNote } from './StatsSection';

const INFO_BODY = (
  <>
    <p>
      Расчётный максимум (1ПМ) — это вес, который вы могли бы поднять один раз. Он
      считается по формуле Эпли: вес × (1 + повторы / 30).
    </p>
    <p>
      Зачем он нужен: он позволяет честно сравнить подходы с разным числом повторений.
      Сегодня вы пожали 50 кг на 10 раз, через неделю 55 кг на 8 — второй подход тяжелее,
      и 1ПМ это покажет.
    </p>
    <p>
      Изменение за месяц — разница между 1ПМ на последней тренировке и на первой
      тренировке этого месяца (или на последней тренировке до его начала, если
      упражнение делали всего раз).
    </p>
    <p>
      Упражнения с собственным весом здесь не показываются: без веса снаряда рассчитать
      максимум невозможно.
    </p>
  </>
);

// Block 3 — «Становлюсь ли я сильнее?»
export function StrengthBlock({ stats }: { stats: MonthStats }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <StatsSection
      title="Прогресс силы"
      info={{
        title: 'Как считается прогресс силы',
        body: INFO_BODY,
        ariaLabel: 'Как считается прогресс силы',
      }}
    >
      {stats.strength.length === 0 ? (
        <EmptyNote>
          В этом месяце нет упражнений с весом. Отмечайте подходы галочкой — и здесь
          появится расчётный максимум по каждому движению.
        </EmptyNote>
      ) : (
        <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
          {stats.strength.map((ex) => (
            <ExerciseRow
              key={ex.name}
              ex={ex}
              open={expanded === ex.name}
              onToggle={() => setExpanded((v) => (v === ex.name ? null : ex.name))}
            />
          ))}
        </div>
      )}
    </StatsSection>
  );
}

function ExerciseRow({
  ex,
  open,
  onToggle,
}: {
  ex: StrengthProgress;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="tappable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium tracking-tight text-ink-900">
            {ex.name}
          </div>
          <div className="tabular mt-0.5 text-[12px] text-ink-400">
            {Math.round(ex.currentOneRm)} кг · расчётный максимум
          </div>
        </div>
        <DeltaBadge ex={ex} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 bg-ink-50 px-4 py-3 text-[13px] text-ink-500">
              <div className="tabular">
                Лучший подход: {ex.bestWeightKg} кг × {ex.bestReps}
              </div>
              {ex.deltaKg !== null ? (
                <div className="tabular">
                  Изменение за месяц: {signed(ex.deltaKg, 1)} кг
                  {ex.deltaPct !== null && ` (${signed(ex.deltaPct, 1)}%)`}
                </div>
              ) : (
                <div>Первый раз в этом месяце — сравнивать пока не с чем</div>
              )}
              <div className="tabular">
                {ex.totalSets} {pluralRu(ex.totalSets, ['подход', 'подхода', 'подходов'])}{' '}
                за {ex.sessions}{' '}
                {pluralRu(ex.sessions, ['тренировку', 'тренировки', 'тренировок'])} ·
                последняя {format(parseISO(ex.lastDate), 'd MMMM', { locale: ru })}
              </div>
              <Link
                href={`/exercise/${encodeURIComponent(ex.name)}`}
                className="tappable inline-block pt-0.5 text-[13px] font-medium text-brand"
              >
                Вся история →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeltaBadge({ ex }: { ex: StrengthProgress }) {
  if (ex.deltaKg === null) {
    return <span className="shrink-0 text-[12px] text-ink-300">новое</span>;
  }
  const rounded = Math.round(ex.deltaKg);
  const up = rounded > 0;
  const down = rounded < 0;
  return (
    <span
      className={cn(
        'tabular shrink-0 text-[13px] font-semibold',
        up ? 'text-marker-green' : down ? 'text-marker-red' : 'text-ink-400'
      )}
    >
      {up ? '▲' : down ? '▼' : '—'} {signed(rounded)} кг
    </span>
  );
}

function signed(n: number, digits = 0): string {
  const v = digits > 0 ? formatDecimalRu(n, digits) : Math.round(n).toString();
  return n > 0 ? `+${v}` : v;
}
