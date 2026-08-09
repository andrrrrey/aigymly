'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useApp } from '@/store/app';
import { computeExerciseStatByName } from '@/lib/exerciseStats';

export default function ExerciseStatsPage() {
  const router = useRouter();
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { workouts } = useApp();

  const stat = useMemo(
    () => computeExerciseStatByName(workouts, name),
    [workouts, name]
  );

  return (
    <>
      <header
        className="shrink-0 border-b border-ink-100 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => router.back()}
            className="tappable -ml-2 grid h-9 w-9 place-items-center rounded-full text-ink-900"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="min-w-0 truncate px-2 text-[17px] font-semibold tracking-tight text-ink-900">
            {name}
          </h1>
          <div className="h-9 w-9" />
        </div>
      </header>

      <main className="no-scrollbar scroll-smooth-momentum flex-1 overflow-y-auto bg-white">
        <div className="px-5 pb-24 pt-5">
          {!stat || stat.days.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-ink-400">
              Пока нет выполненных подходов. Отметьте подход галочкой, чтобы он
              попал в статистику.
            </p>
          ) : (
            <div className="space-y-6">
              {stat.days.map((day) => (
                <div key={day.date} className="border-b border-ink-100 pb-5 last:border-b-0">
                  <h2 className="mb-3 text-[16px] font-semibold tracking-tight text-ink-900">
                    {format(parseISO(day.date), 'd MMMM, yyyy', { locale: ru })}
                  </h2>
                  <div className="grid grid-cols-[40px_1fr_1fr] gap-2 pb-2 text-[12px] uppercase tracking-wider text-ink-400">
                    <div>#</div>
                    <div className="text-right">Вес, кг</div>
                    <div className="text-right">Повторы</div>
                  </div>
                  <div className="space-y-1.5">
                    {day.sets.map((s, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[40px_1fr_1fr] items-center gap-2 text-[15px] text-ink-900"
                      >
                        <div className="tabular text-ink-500">{idx + 1}</div>
                        <div className="tabular text-right">{s.weightKg}</div>
                        <div className="tabular text-right">{s.reps}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
