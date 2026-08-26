'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { formatNumRu, pluralRu } from '@/lib/utils';
import { workoutTonnage } from '@/lib/statsMonth';
import type { Workout } from '@/types';
import { StatsSection, EmptyNote } from './StatsSection';

// Block 5 — «Что я делал в прошлый раз?»
export function LastWorkoutBlock({ workout }: { workout: Workout | null }) {
  return (
    <StatsSection title="Последняя тренировка">
      {!workout ? (
        <EmptyNote>В этом месяце ещё не было отмеченных тренировок.</EmptyNote>
      ) : (
        <LastWorkoutCard workout={workout} />
      )}
    </StatsSection>
  );
}

function LastWorkoutCard({ workout }: { workout: Workout }) {
  const exercises = workout.exercises
    .filter((ex) => ex.kind === 'strength')
    .map((ex) => ({
      name: ex.name,
      doneSets: (ex.sets ?? []).filter((s) => s.done).length,
    }))
    .filter((ex) => ex.doneSets > 0);

  return (
    <Link
      href={`/workout/${workout.id}`}
      className="tappable block rounded-2xl border border-ink-100 p-4 hover:bg-ink-50"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-ink-400">
            {format(parseISO(workout.date), 'd MMMM, EEEE', { locale: ru })}
          </div>
          <div className="mt-0.5 truncate text-[17px] font-semibold tracking-tight text-ink-900">
            {workout.title}
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-ink-300" />
      </div>

      <div className="mt-3 space-y-1">
        {exercises.map((ex) => (
          <div key={ex.name} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[14px] text-ink-900">{ex.name}</span>
            <span className="tabular shrink-0 text-[13px] text-ink-400">
              {ex.doneSets} {pluralRu(ex.doneSets, ['подход', 'подхода', 'подходов'])}
            </span>
          </div>
        ))}
      </div>

      <div className="tabular mt-3 border-t border-ink-100 pt-3 text-[13px] text-ink-500">
        Нагрузка: {formatNumRu(workoutTonnage(workout))} кг
      </div>
    </Link>
  );
}
