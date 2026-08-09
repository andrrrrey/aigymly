'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/store/app';
import { computeExerciseStats } from '@/lib/exerciseStats';
import { pluralRu } from '@/lib/utils';

export default function StatsPage() {
  const { workouts } = useApp();
  const router = useRouter();
  const exerciseStats = useMemo(() => computeExerciseStats(workouts), [workouts]);
  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 pb-3 pt-3">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
            Статистика
          </h1>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 pb-24">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Всего тренировок" value={workouts.length.toString()} />
          <StatTile
            label="Подходов сделано"
            value={workouts
              .flatMap((w) => w.exercises.flatMap((e) => e.sets ?? []))
              .filter((s) => s.done)
              .length.toString()}
          />
          <StatTile
            label="Поднято, кг"
            value={Math.round(
              workouts
                .flatMap((w) => w.exercises.flatMap((e) => e.sets ?? []))
                .filter((s) => s.done)
                .reduce((sum, s) => sum + s.reps * s.weightKg, 0)
            ).toString()}
          />
          <StatTile label="Стрик" value="3 дня" />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-[17px] font-semibold tracking-tight text-ink-900">
            Упражнения
          </h2>
          {exerciseStats.length === 0 ? (
            <p className="rounded-2xl bg-ink-50 p-4 text-[13px] leading-snug text-ink-500">
              Отмечайте подходы галочкой во время тренировки — выполненные
              упражнения появятся здесь, и вы сможете смотреть их историю.
            </p>
          ) : (
            <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
              {exerciseStats.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => router.push(`/exercise/${encodeURIComponent(ex.name)}`)}
                  className="tappable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium tracking-tight text-ink-900">
                      {ex.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-400">
                      {ex.totalDoneSets}{' '}
                      {pluralRu(ex.totalDoneSets, ['подход', 'подхода', 'подходов'])}
                      {ex.lastDate
                        ? ` · ${format(parseISO(ex.lastDate), 'd MMM yyyy', { locale: ru })}`
                        : ''}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-ink-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50 p-4">
          <h3 className="text-[15px] font-semibold text-ink-900">Сводка от AI</h3>
          <p className="mt-1 text-[13px] leading-snug text-ink-500">
            Здесь AI будет анализировать прогресс и давать рекомендации на основе истории твоих тренировок.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <div className="tabular text-[24px] font-semibold tracking-tight text-ink-900">{value}</div>
      <div className="mt-0.5 text-[12px] text-ink-500">{label}</div>
    </div>
  );
}
