'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatNumRu } from '@/lib/utils';
import type { MonthStats } from '@/lib/statsMonth';
import { StatsSection, EmptyNote } from './StatsSection';
import { InfoSheetLink } from './InfoSheet';
import { TonnageChart } from './TonnageChart';

const INFO_BODY = (
  <>
    <p>
      Нагрузка — это общий вес, поднятый за тренировку: вес снаряда × количество
      повторений, просуммированный по всем выполненным подходам.
    </p>
    <p>На что обратить внимание:</p>
    <ul className="space-y-1 pl-4">
      <li className="list-disc">Линия вверх → прогресс идёт, так держать!</li>
      <li className="list-disc">
        Линия вниз → возможно, стоит увеличить вес или добавить подходы.
      </li>
      <li className="list-disc">
        Линия ровная → организм адаптировался, пора менять программу.
      </li>
    </ul>
    <p>
      Регулярный рост нагрузки — главный признак того, что вы становитесь сильнее и
      выносливее. Упражнения с собственным весом в нагрузку не попадают: поднятого веса
      в них нет.
    </p>
    <p>
      <InfoSheetLink href="https://aigymly.ru/blog/tonnage">
        Подробнее в блоге →
      </InfoSheetLink>
    </p>
  </>
);

// Block 2 — «Растёт ли моя нагрузка?»
export function TonnageBlock({ stats }: { stats: MonthStats }) {
  return (
    <StatsSection
      title="Нагрузка за месяц"
      info={{
        title: 'Что такое «Нагрузка»?',
        body: INFO_BODY,
        ariaLabel: 'Что такое нагрузка',
      }}
    >
      {stats.days.length === 0 ? (
        <EmptyNote>
          В этом месяце ещё нет отмеченных подходов — отмечайте их галочкой во время
          тренировки, и график появится здесь.
        </EmptyNote>
      ) : (
        // Remounting on month change resets the selected day for free.
        <ChartCard key={stats.monthKey} stats={stats} />
      )}
    </StatsSection>
  );
}

function ChartCard({ stats }: { stats: MonthStats }) {
  const [selectedIndex, setSelectedIndex] = useState(stats.days.length - 1);
  const selected = stats.days[selectedIndex] ?? stats.days[stats.days.length - 1];

  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="flex items-baseline justify-between text-[12px] text-ink-400">
        <span>Нагрузка, кг</span>
        <span className="tabular">
          {format(parseISO(selected.date), 'd MMMM', { locale: ru })} ·{' '}
          <span className="font-semibold text-ink-900">
            {formatNumRu(selected.tonnageKg)} кг
          </span>
        </span>
      </div>

      <div className="mt-2">
        <TonnageChart
          points={stats.days}
          avg={stats.avgTonnageKg}
          max={stats.maxTonnageKg}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      <div className="text-center text-[12px] text-ink-400">Дни тренировок</div>

      <div className="mt-4 border-t border-ink-100 pt-4">
        <div className="text-[13px] text-ink-500">Общая нагрузка за месяц</div>
        <div className="tabular mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-ink-900">
          {formatNumRu(stats.totalTonnageKg)} кг
        </div>
        <div className="tabular mt-2 text-[12px] text-ink-400">
          Средняя нагрузка за тренировку: {formatNumRu(stats.avgTonnageKg)} кг
        </div>
      </div>
    </div>
  );
}
