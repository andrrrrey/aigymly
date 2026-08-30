'use client';

import { formatDecimalRu, pluralRu } from '@/lib/utils';
import type { MonthStats } from '@/lib/statsMonth';

// Block 1 — «Как часто я тренируюсь?»
export function DisciplineBlock({ stats }: { stats: MonthStats }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-2">
        <Tile
          value={stats.workoutCount.toString()}
          label={pluralRu(stats.workoutCount, ['тренировка', 'тренировки', 'тренировок'])}
        />
        <Tile value={formatDecimalRu(stats.perWeek)} label="в неделю" />
      </div>
    </section>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <div className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink-900">
        {value}
      </div>
      <div className="mt-1.5 text-[12px] text-ink-500">{label}</div>
    </div>
  );
}
