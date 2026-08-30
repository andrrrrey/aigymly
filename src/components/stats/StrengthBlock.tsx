'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, formatDecimalRu, pluralRu } from '@/lib/utils';
import type { MonthStats, StrengthProgress } from '@/lib/statsMonth';
import { StatsSection, EmptyNote } from './StatsSection';
import { InfoSheetLink } from './InfoSheet';

const INFO_BODY = (
  <>
    <p>
      Это показатель, который отвечает на главный вопрос: «Я становлюсь сильнее?»
    </p>
    <p>
      Приложение пересчитывает ваш лучший подход за месяц в расчётный максимум —
      эквивалент одного повторения. Это позволяет честно сравнивать тренировки, даже
      если вы меняли вес или количество повторений.
    </p>
    <p>
      Цифра со знаком + или – — это разница между результатом сейчас и месяц назад.
      Зелёная стрелка вверх означает, что прогресс есть. Серая черта — результат не
      изменился.
    </p>
    <ul className="space-y-1 pl-4">
      <li className="list-disc">
        <b>«Лучший подход»</b> — подход, из которого получился расчётный максимум.
      </li>
      <li className="list-disc">
        <b>«Изменение за месяц»</b> — прогресс в килограммах и процентах.
      </li>
      <li className="list-disc">
        <b>Количество подходов и тренировок</b> — как часто вы делали упражнение.
      </li>
    </ul>
    <p>Как это использовать:</p>
    <ul className="space-y-1 pl-4">
      <li className="list-disc">
        Расчётный максимум растёт → становитесь сильнее, всё идёт по плану.
      </li>
      <li className="list-disc">
        Стоит на месте → организм привык, пора увеличивать вес или подходы.
      </li>
      <li className="list-disc">
        Падает → возможно, вы переутомились. Сделайте лёгкую тренировку или отдохните.
      </li>
    </ul>
    <p>
      <InfoSheetLink href="https://aigymly.ru/blog/1rm">
        Подробнее в блоге →
      </InfoSheetLink>
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
        title: '«Прогресс силы» — что это?',
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
